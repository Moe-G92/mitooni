"""Synthetic local provider-boundary tests. No keys, network or speech service."""
import hashlib
import io
import json
import logging
import math
import shutil
import struct
import unittest
import uuid
import wave
from unittest import mock
import content_provider_audio as provider


def fixture():
    out=io.BytesIO()
    with wave.open(out,'wb') as wav:
        wav.setparams((1,2,24000,0,'NONE','not compressed'))
        wav.writeframes(b''.join(struct.pack('<h',int(9000*math.sin(i*2*math.pi*440/24000))) for i in range(4800)))
    return out.getvalue()


class Response:
    def __init__(self,data=None,fail=False,mime='audio/wav'):
        self.data=fixture() if data is None else data
        self.fail=fail
        self.headers={'content-type':mime,'x-request-id':'synthetic-request-001'}
    def __enter__(self):return self
    def __exit__(self,*args):pass
    def iter_bytes(self):
        yield self.data[:100]
        if self.fail:raise TimeoutError('sensitive provider detail must not be saved')
        yield self.data[100:]


class SDK:
    def __init__(self,response):
        self.response=response;self.calls=0;self.options=[]
        self.audio=self;self.speech=self;self.with_streaming_response=self
    def with_options(self,**kwargs):self.options.append(kwargs);return self
    def create(self,**kwargs):self.calls+=1;return self.response


class Tests(unittest.TestCase):
    def setUp(self):
        self.directory=provider.run_dir('provider-test-'+uuid.uuid4().hex)
        self.directory.mkdir(parents=True)
        self.ledger=provider.Ledger(self.directory/'ledger.sqlite3')
        self.ledger.register('run','plan','synthetic approval',2_000_000)
        self.request={'assetId':'synthetic','segment':0,'role':'speaker',
                      'body':{'model':provider.MODEL,'voice':'onyx','input':'A synthetic sentence.',
                              'response_format':'wav','speed':1.0},
                      'sourceBinding':{'targetId':'synthetic','pointer':'/text','valueSha256':'synthetic'},
                      'reservedMicroUsd':len('A synthetic sentence.'.encode())*30}
        self.request['requestHash']=provider.sha(self.request)
    def tearDown(self):
        self.ledger.db.close();shutil.rmtree(self.directory)
    def obtain(self,sdk):
        return provider.obtain(sdk,self.request,self.directory/'turn',self.ledger,'run')
    def test_real_local_decode_receipt_and_completed_recovery_no_resend(self):
        sdk=SDK(Response());receipt=self.obtain(sdk)
        self.assertEqual(receipt['state'],'completed');self.assertGreater(receipt['mp3']['durationSeconds'],0)
        self.assertEqual(sdk.options,[{'max_retries':0,'timeout':120.0}])
        self.assertEqual(self.obtain(sdk),receipt);self.assertEqual(sdk.calls,1)
        path=provider.local.ROOT/receipt['mp3']['path'];path.write_bytes(b'tampered')
        with self.assertRaises(ValueError):self.obtain(sdk)
        self.assertEqual(sdk.calls,1)
    def test_installed_sdk_mock_transport_no_network(self):
        try:
            import httpx
            from openai import OpenAI
        except ImportError:
            self.skipTest('Use existing platform/backend/.venv/bin/python for installed SDK contract check')
        sent=[]
        def receive(request):
            sent.append(request)
            self.assertEqual(str(request.url),'https://api.openai.com/v1/audio/speech')
            body=json.loads(request.content)
            self.assertEqual(body,self.request['body'])
            return httpx.Response(200,headers={'content-type':'audio/wav','x-request-id':'synthetic-sdk-id'},content=fixture())
        client=OpenAI(api_key='synthetic-not-a-live-key',organization='',project='',webhook_secret='',
                      base_url='https://api.openai.com/v1',max_retries=0,
                      http_client=httpx.Client(transport=httpx.MockTransport(receive),trust_env=False))
        try:
            result=self.obtain(client)
            self.assertEqual(result['providerRequestId'],'synthetic-sdk-id')
            self.assertEqual(len(sent),1)
        finally:client.close()
    def test_sdk_debug_diagnostics_never_emit_private_input(self):
        try:
            import httpx
            from openai import OpenAI
        except ImportError:
            self.skipTest('Installed backend SDK required')
        captured=io.StringIO();handler=logging.StreamHandler(captured)
        logger=logging.getLogger('openai._base_client');oldlevel=logger.level
        previous=logging.getLogRecordFactory()
        logger.setLevel(logging.DEBUG);logger.addHandler(handler)
        client=OpenAI(api_key='synthetic-not-live-key',organization='',project='',webhook_secret='',
                      base_url='https://api.openai.com/v1',max_retries=0,
                      http_client=httpx.Client(transport=httpx.MockTransport(lambda request:httpx.Response(
                          200,headers={'content-type':'audio/wav','x-request-id':'synthetic-debug'},content=fixture())),trust_env=False))
        try:
            self.obtain(client)
            self.assertNotIn('A synthetic sentence.',captured.getvalue())
            self.assertNotIn('synthetic-not-live-key',captured.getvalue())
            self.assertIn('SDK diagnostic suppressed',captured.getvalue())
        finally:
            client.close();logger.removeHandler(handler);logger.setLevel(oldlevel)
            logging.setLogRecordFactory(previous)
    def test_unknown_stream_failure_retains_full_budget_and_blocks_resend(self):
        sdk=SDK(Response(fail=True))
        with self.assertRaises(ValueError):self.obtain(sdk)
        self.assertEqual(self.ledger.state(self.request)[0],'unknown')
        reserved=self.ledger.db.execute('SELECT reserved FROM runs').fetchone()[0]
        self.assertEqual(reserved,self.request['reservedMicroUsd'])
        with self.assertRaises(ValueError):self.obtain(sdk)
        self.assertEqual(sdk.calls,1)
        self.assertNotIn('sensitive',(self.directory/'turn/unknown.json').read_text())
    def test_crash_intent_and_cross_run_claim_do_not_resend(self):
        self.ledger.claim(self.request,'run')
        self.ledger.register('run2','plan2','different approval',2_000_000)
        with self.assertRaises(ValueError):self.ledger.claim(self.request,'run2')
        sdk=SDK(Response())
        with self.assertRaises(ValueError):self.obtain(sdk)
        self.assertEqual(sdk.calls,0)
    def test_budget_denied_before_network(self):
        self.ledger.db.execute('UPDATE runs SET cap=1')
        sdk=SDK(Response())
        with self.assertRaises(ValueError):self.obtain(sdk)
        self.assertEqual(sdk.calls,0)
    def test_negative_reservation_rejected(self):
        self.request['reservedMicroUsd']=-30
        self.request['requestHash']=provider.sha({k:v for k,v in self.request.items() if k!='requestHash'})
        sdk=SDK(Response())
        with self.assertRaises(ValueError):self.obtain(sdk)
        self.assertEqual(sdk.calls,0)
    def test_bad_mime_and_signature_become_unknown(self):
        sdk=SDK(Response(mime='text/html'))
        with self.assertRaises(ValueError):self.obtain(sdk)
        self.assertEqual(self.ledger.state(self.request)[0],'unknown')
    def test_byte_bound(self):
        sdk=SDK(Response())
        with mock.patch.object(provider,'MAX_BYTES',50),self.assertRaises(ValueError):self.obtain(sdk)
        self.assertEqual(self.ledger.state(self.request)[0],'unknown')
    def test_source_exact_plan_and_no_client_creation(self):
        original=provider.BASE_MANIFEST.read_bytes()
        p=provider.plan()
        self.assertEqual(len(p['requests']),138)
        self.assertEqual(sum(len(r['body']['input']) for r in p['requests']),43652)
        self.assertEqual(p['maximumModelUsageMicroUsd'],1_310_220)
        self.assertEqual(original,provider.BASE_MANIFEST.read_bytes())
        self.assertEqual(provider.sha(p),provider.sha(provider.plan()))
    def test_path_and_symlink_rejected(self):
        with self.assertRaises(ValueError):provider.run_dir('../escape')
        link=self.directory/'escape';link.symlink_to('/private/tmp',target_is_directory=True)
        with self.assertRaises(ValueError):provider.local.safe_path(link/'file',provider.local.OUTPUT)
    def test_future_deadline_refuses(self):
        with mock.patch.object(provider,'DEADLINE','2000-01-01'),self.assertRaises(ValueError):provider.fresh()


if __name__=='__main__':unittest.main()
