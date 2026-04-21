from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal
from uuid import uuid4

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="Insight Dynamics Shooting Analyzer")


class AnalysisResult(BaseModel):
    startBeepTime: float | None = None
    shots: list[dict[str, Any]] = Field(default_factory=list)
    firstShotTime: float | None = None
    bestSplit: float | None = None
    splits: list[float] = Field(default_factory=list)
    totalShots: int = 0


class AnalysisJob(BaseModel):
    jobId: str
    status: Literal['queued', 'analyzing', 'completed', 'failed']
    videoUrl: str
    createdAt: str
    updatedAt: str
    error: str | None = None
    result: AnalysisResult | None = None


class CreateJobRequest(BaseModel):
    jobId: str | None = None
    videoUrl: str
    settings: dict[str, Any]
    matchInfo: dict[str, Any]


JOBS: dict[str, AnalysisJob] = {}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def verify_api_key(authorization: str | None):
    expected = None
    # Set ANALYZER_API_KEY in the deployment environment and mirror it in Vercel.
    # This starter keeps auth optional until you enable it.
    if expected and authorization != f"Bearer {expected}":
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.get('/health')
def health():
    return {'ok': True}


@app.post('/jobs')
def create_job(payload: CreateJobRequest, authorization: str | None = Header(default=None)):
    verify_api_key(authorization)
    job_id = payload.jobId or str(uuid4())
    created = now_iso()

    # Starter behavior:
    # Queue the job and immediately mark it as failed with an explicit message.
    # Replace this block with:
    # 1) download videoUrl
    # 2) extract audio with ffmpeg
    # 3) detect start beep and shots
    # 4) save completed result
    JOBS[job_id] = AnalysisJob(
        jobId=job_id,
        status='failed',
        videoUrl=payload.videoUrl,
        createdAt=created,
        updatedAt=created,
        error='Analyzer starter is connected, but real FFmpeg + shot detection is still TODO in analyzer/main.py.',
        result=None,
    )
    return {'jobId': job_id, 'status': 'failed'}


@app.get('/jobs/{job_id}')
def get_job(job_id: str, authorization: str | None = Header(default=None)):
    verify_api_key(authorization)
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail='Job not found')
    return job.model_dump()
