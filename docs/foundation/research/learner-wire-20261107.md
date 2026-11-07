# Frozen candidate wire v1

Implementation checkpoint 7 November. Python request DTOs `platform/backend/app/contracts/learner.py`. Auth bearer + X-Expected-User-Id and UUID Idempotency-Key on mutations; expected revision in body. Entitlements `learner:use` and `learner:tutor` (latter additionally provider configured). All JSON fields camelCase. Revisions begin1; missing preferences revision0. Full candidate namespace /api/learner. GET operations no keys.

## Shared output

Preferences `{revision,examTrack,weeklyHours,testDate,targets:{overall,listening,reading,writing,speaking},selfReportedLevel,locale}`.

Task `{id,title,skill,examTrack,kind,sections:[{id,title,text,instructions,questions:[{id,prompt,responseType,options:[{id,text}],wordLimit,minimumWords}],table}],assets:[{id,mediaType,sha256,alt,durationSeconds}],teachingAnchors:[{id,label,text}],objectiveIds}`. Optional source fields may be omitted, UI defaults empty. task.kind reading_items|listening_items|academic_task1|gt_task1|task2|speaking_turn. responseType from source single_choice/short_text/extended_text/spoken_response or explicit matching/multi_select/ordered. Never keys/scripts/privatepaths. Teaching anchors empty for independent work.

ContentRef `{catalogHash,taskId,version,contentHash,policyVersion}`. Step `{id,kind,skill,title,taskId,contentRef,objectiveIds,estimatedMinutes,state,reasonEvidenceIds}` kind lesson|practice|repair|transfer; state available|locked|in_progress|completed|unavailable.

Plan `{id,version,status,preferencesRevision,evidenceRevision,policyVersion,weeklyCapacityMinutes,steps,createdAt}` status active|superseded|needs_attention.

Draft `{revision,responses:[{itemId,kind,value}]}` kind choice|short_text|multi_select|matching|ordered|essay|recording; value string|string[]|{string:string}. Recording value is recordingId UUID, not bytes or blob URL.

Attempt `{id,status,parentAttemptId,contentRef,conditions:{original,current,revision,assisted,exposureEligible},startedAt,deadlineAt,submittedAt,responseHash,responses}` status open|submitted|expired. Open attempt responses[]; frozen submission returned only after submit.

Workspace `{id,revision,task,contentRef,draft,attempt,capabilities,latestJobId,feedback,rawCheck,sessionId,sectionId,planId,stepId,serverNow}`. capabilities string[] draft:write|attempt:submit|support:switch|tutor:use|attempt:revise|recording:write. feedback is terminal Job.output or null. rawCheck `{actorKind:deterministic_check,itemCount,correctCount,items:[{itemId,correct}]}` or null (no keys until reveal permitted). serverNow UTC ISO.

Section `{id,skill,title,taskId,contentRef,status,workspaceId,startedAt,deadlineAt,durationSeconds}` status locked|ready|running|submitted|expired|review_pending|reviewed. Session `{id,revision,kind,examTrack,status,sections,startedAt,completedAt,serverNow}` kind baseline|mock; status ready|running|submitted|review_pending|completed|abandoned. A Session resolves/starts sections sequentially; resolve may atomically start next ready section. Creating Session does not start clock.

Job `{id,revision,workspaceId,attemptId,intent,status,output,error,retryAction,createdAt}` statuses queued|running|cancel_requested|canceled|completed|failed|dispatch_unknown; output null or `{kind,text,citations:[{anchorId,label}],observations:[{criterionId,text,workSpanIndexes}],workSpans:[{start,end,quote}],proposal}` for text, Speaking output `{kind:qualitative_speaking_feedback,criteria,limitations,timestampStatus,assessmentScope}`. proposal null or `{id,targetStepId,evidenceIds,expectedPlanVersion,expectedEvidenceRevision}`. error null or `{code,message}`. Poll returns Job directly (not wrapper). No raw provider text/events.

## Endpoints (bodies are exact DTO file)

- GET `/bootstrap` -> `{preferences,preferencesRevision,evidenceRevision,activePlan,resumableSession,providerAvailable,capabilities}`; null activePlan/session/preferences if absent. Does not include account identity/profile (existing /api/account remains authoritative).
- PATCH `/preferences` PreferencesIn -> Preferences.
- POST `/baselines` BaselineIn -> Session; GET `/sessions` -> `{sessions:[Session]}`.
- GET `/sessions/{id}` -> Session; POST `/sessions/{id}/start` StartIn -> Session (start first/next ready section).
- POST `/sessions` SessionIn -> Session. mockId is catalogue prefix/track instrument selector from GET `/mocks`; mockVersion1 currently. GET `/mocks` -> `{mocks:[{id,version,title,examTrack,skills,durationSeconds,available,reason}]}`.
- POST `/plans` PlanIn -> Plan; GET `/plans/current` -> Plan or null. GET `/plans` -> `{plans:[Plan]}`.
- POST `/workspaces/resolve` ResolveIn -> Workspace; GET `/workspaces/{id}` -> Workspace.
- PATCH `/workspaces/{id}/draft` DraftIn -> Workspace (not Draft alone).
- POST `/attempts/{id}/submit` SubmitIn -> Workspace.
- POST `/workspaces/{id}/assistance` AssistanceIn -> Workspace.
- POST `/attempts/{id}/revisions` RevisionIn -> Workspace.
- POST `/workspaces/{id}/turns` TurnIn -> Job HTTP202; workRef `{kind:draft|attempt,id,revision}`. Draft id=workspace.id. Attempt revision=draft revision at submit. FeedbackIn below avoids constructing workRef for common feedback action.
- POST `/attempts/{id}/feedback` FeedbackIn -> Job HTTP202.
- GET `/jobs/{id}` -> Job; POST `/jobs/{id}/cancel` CancelIn -> Job.
- POST `/plans/{planId}/proposals/{proposalId}/accept` AcceptIn -> Plan.
- POST `/attempts/{id}/recordings?itemId=...&expectedDraftRevision=...` raw `audio/wav` request body (no multipart/base64). Same bearer/owner/idempotency headers. -> `{id,sha256,durationSeconds,sizeBytes,mediaType:audio/wav}` HTTP201. GET `/recordings/{id}/audio` raw authenticated WAV. Item and ownership/attempt binding server checked before bytes admitted.
- GET `/workspaces/{id}/assets/{assetId}` raw authenticated task-bound bytes; candidate media playback uses authenticated fetch->blob, no anonymous asset URL.
- GET `/progress` -> `{evidenceRevision,skills:[{skill,itemCount,correctCount,submittedCount,supportedCount,independentCount,feedbackCount,objectiveIds}],recentAttempts:[{id,skill,title,submittedAt,conditions,rawCheck,workspaceId}],nextActions:[{stepId,title,skill}],noBandEstimate:true}`.
- GET `/vocabulary` -> `{items:[{id,word,meaning,example,sourceTaskId,createdAt}],available:boolean}`; POST `/vocabulary` `{word,meaning?,example?,sourceTaskId?,expectedRevision}` -> same list. Candidate-owned manual entries first; no invented automatic dictionary content.
- GET `/coaching` -> `{available:false,requests:[]}` unless human operational service explicitly configured. GET `/results` -> `{attempts:[same recentAttempts]}`. GET `/results/{attemptId}` -> Workspace. Backend operational empty state no fake bookings.

Errors detail `{code,message}` plus requestId. Stable codes access_required,revision_conflict,content_changed,content_gap,content_withdrawn,condition_switch_required,submission_required,assessment_not_complete,deadline_passed,provider_unavailable,provider_rate_limited,budget_exhausted,dispatch_unknown,invalid_audio,storage_limit,idempotency_conflict,invalid_request. HTTP401 auth,403 access,404owned missing,409conflict,413bytes,422input,429quota,503provider/storage. Empty data returns meaningful empty arrays/null, no demo fallback.

## Final additive wire refinements

Workspace includes messages (last20 paired completed request/output jobs), sessionKind null|baseline|mock, playbackPolicy replay|one_pass and listeningPlayback null|{startedAt,serverNow,elapsedSeconds,orderedAssetIds,durationsSeconds,nonce}. GET/workspaces/{id}/messages?before=jobId&limit=20 returns {messages,nextCursor}; chronological paired messages include id,jobId,requestText,output,createdAt. POST/workspaces/{id}/playback/start {expectedWorkspaceRevision} is mockListening-only, returns Workspace, preserves once-only timestamp/nonce across new keys and GET-derived offset; mockListening submit without it409playback_required. Section deadline never resets.

Plan includes recommendedStepId,skillBranches,planningHorizonDays,scheduledMinutes,unscheduledMinutes; steps scheduled,scheduledDate. Manual availability is separate from schedule capacity. Vocabulary aggregate includes revision,serverNow; entries have reviewRevision,dueAt,lastReviewedAt,lastRecall,due. POST/vocabulary/{id}/reviews {expectedRevision,recall:again|known} returns full aggregate, exact-operation retry. GET/POST /feedback aggregate revision/items; POST {expectedRevision,text,route,workspaceId?}; no outside sends.

## Authoritative answer review delta

Workspace and `/results/{attemptId}` now include `answerReview: null | {actorKind:'authoritative_answer_key',items:[{itemId,acceptedAnswers:[string|string[]|Record<string,string>],rationale:string|null}],answerGroups:[{questionIds:string[],acceptedAnswers:[string|string[]|Record<string,string>],orderIndependent:boolean,distinct:boolean}]}`. Only frozen Reading/Listening work under current publication and full-mock family-release policy receives it. Starting-practice sections may review immediately after immutable submission; full mocks wait for all sections, including related-family requests/replayed operations. Productive Writing/Speaking never publish a model right answer. Values/rationale are the exact admitted assessment fields; no generated explanation. First release records an irreversible `answer_reveal` fact before response bytes, exactly once per attempt. Current publication withdrawal strips this source material. It is a learner-serving projection, separate from private model input policy.
