"""Explicit local synthetic plumbing fixture; no speech validity claim."""
from app.contracts.speaking import SpeakingCandidate, CRITERIA
from app.providers.speaking_runner import PreparedSpeaking,SpeakingResult
from app.media.speaking import admit_wav

class SyntheticSpeakingRunner:
    kind='synthetic'
    def prepare(self,bound,audio):
        if admit_wav(audio.data)!=audio or audio.sha256!=bound.recordingSha256:raise ValueError('Invalid synthetic binding')
        return PreparedSpeaking(bound,audio)
    async def run(self,prepared):
        if prepared.used:raise ValueError('Duplicate synthetic dispatch')
        prepared.used=True
        candidate=SpeakingCandidate.model_validate(dict(kind='qualitative_speaking_feedback',criteria=[dict(criterionId=k,status='insufficient_evidence',observation='Synthetic local test; speech was not assessed.',revisionAction='Ask an IELTS teacher to review the actual recording.',evidence=[],limitation='The synthetic runner cannot assess speaking.') for k in sorted(CRITERIA)],limitations=['Synthetic engineering output; no provider assessment occurred.'],timestampStatus='model_estimated_unverified',assessmentScope='recorded_rehearsal'))
        return SpeakingResult(candidate,'synthetic-local','synthetic-'+prepared.bound.dispatchId,dict(inputTokens=0,outputTokens=0,totalTokens=0))
