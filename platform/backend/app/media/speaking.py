"""Bounded PCM WAV admission. Bytes are private and must never be logged."""
from dataclasses import dataclass, field
import hashlib
import io
import struct
import wave

MAX_WAV_BYTES = 18 * 1024 * 1024


class AudioAdmissionError(ValueError):
    def __init__(self, code="invalid_audio"):
        self.code = code
        super().__init__(code)


@dataclass(frozen=True)
class AdmittedWav:
    data: bytes = field(repr=False)
    sha256: str
    size_bytes: int
    duration_seconds: float
    sample_rate: int
    channels: int
    sample_width: int


def admit_wav(data: bytes) -> AdmittedWav:
    if not isinstance(data, bytes) or not 44 <= len(data) <= MAX_WAV_BYTES:
        raise AudioAdmissionError("audio_size")
    if data[:4] != b"RIFF" or data[8:12] != b"WAVE":
        raise AudioAdmissionError("audio_format")
    # Reject trailing/truncated payloads and malformed chunks before decoder IO.
    if struct.unpack_from("<I", data, 4)[0] + 8 != len(data):
        raise AudioAdmissionError("invalid_audio")
    offset, counts, data_size = 12, {}, None
    while offset < len(data):
        if offset + 8 > len(data):
            raise AudioAdmissionError()
        name, size = data[offset:offset + 4], struct.unpack_from("<I", data, offset + 4)[0]
        end = offset + 8 + size
        if end > len(data):
            raise AudioAdmissionError()
        counts[name] = counts.get(name, 0) + 1
        if name == b"fmt ":
            if size < 16:
                raise AudioAdmissionError()
            encoding, channels, rate, byte_rate, block_align, bits = struct.unpack_from("<HHIIHH", data, offset + 8)
            if (encoding != 1 or channels not in (1, 2) or bits != 16
                    or not 8000 <= rate <= 48000 or block_align != channels * 2
                    or byte_rate != rate * block_align):
                raise AudioAdmissionError("audio_format")
        if name == b"data":
            data_size = size
        offset = end + (size % 2)
    if offset != len(data) or counts.get(b"fmt ") != 1 or counts.get(b"data") != 1:
        raise AudioAdmissionError()
    try:
        with wave.open(io.BytesIO(data), "rb") as audio:
            channels, width, rate, frames = (audio.getnchannels(), audio.getsampwidth(),
                                            audio.getframerate(), audio.getnframes())
            if audio.getcomptype() != "NONE" or channels not in (1, 2) or width != 2 or not 8000 <= rate <= 48000:
                raise AudioAdmissionError("audio_format")
            duration = frames / rate
            if not 0.25 <= duration <= 180:
                raise AudioAdmissionError("audio_duration")
            if data_size != frames * channels * width or len(audio.readframes(frames + 1)) != data_size:
                raise AudioAdmissionError()
    except (wave.Error, EOFError, struct.error, OverflowError):
        raise AudioAdmissionError() from None
    return AdmittedWav(data, hashlib.sha256(data).hexdigest(), len(data), duration, rate, channels, width)
