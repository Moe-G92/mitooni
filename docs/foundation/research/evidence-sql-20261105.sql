-- BarEx read-only evidence, executed via Supabase MCP on 2026-11-05.
-- Project qvyuuiyueqbquvjhidgb. No mutation or custom function calls.
-- LIMIT 100000 is a safety bound, not a representative sample.
-- Results below that bound support complete returned scope; no production timeout changed.
-- Cohort suppression threshold: 10 distinct learners. Do not re-export small counts.

-- Metadata discovery (executed before aggregates; no row payloads)
select c.relname as table_name, c.relkind, c.reltuples::bigint as estimated_rows from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p','v','m') order by c.relname limit 250;
select table_name, string_agg(column_name||':'||data_type, ', ' order by ordinal_position) as columns from information_schema.columns where table_schema='public' and table_name in ('question_attempts','served_questions','mock_sessions','lead_packs','lead_study_progress','lead_anchor_progress','flashcard_bank_review_log','flashcard_review_log','flashcard_bank_srs_state','study_journeys','journey_steps','journey_execution_blocks','journey_replan_reviews','coaching_reviews','coaching_engagements','exam_result_uploads','lead_assessment_batch_runs','lead_assessment_question_results') group by table_name order by table_name;


-- q_coverage_semantics
select count(*) rows,count(*) filter(where coverage_pct is null) missing_coverage,count(*) filter(where coverage_pct<0 or coverage_pct>1) outside_fraction_range,count(*) filter(where anchor_count>0 and abs(coverage_pct-(covered_count::numeric/anchor_count))>0.001) inconsistent_ratio from (select covered_count,anchor_count,coverage_pct from public.lead_study_progress limit 100000)t;

-- q_cohort_metadata
select current_timestamp as query_executed_at_utc, current_setting('TimeZone') as database_timezone, (select string_agg(column_name,', ' order by column_name) from information_schema.columns where table_schema='public' and table_name='profiles' and column_name ~* '(test|internal|synthetic|staff|admin|role|fixture)') as possible_cohort_flag_columns;


-- q_activity
with a as (select user_id,question_id,mock_session_id,is_correct,answered_at from public.question_attempts where answered_at >= timestamptz '2026-08-01' and answered_at < timestamptz '2026-11-06' limit 100000), g as (select user_id,question_id,count(*) n from a group by 1,2), m as (select user_id,status,completed_at,assessment_version,retake_of_session_id from public.mock_sessions where created_at >= timestamptz '2026-08-01' and created_at < timestamptz '2026-11-06' limit 100000) select 'question_attempts' as metric, count(*) as rows, case when count(distinct user_id)>=10 then count(distinct user_id)::text else 'suppressed (<10)' end as learners, count(*) filter(where is_correct is null) as missing_outcome, count(*) filter(where mock_session_id is null) as practice_rows, (select count(*) from g where n>1) as repeated_user_item_pairs from a union all select 'mock_sessions',count(*),case when count(distinct user_id)>=10 then count(distinct user_id)::text else 'suppressed (<10)' end,count(*) filter(where assessment_version is null),count(*) filter(where completed_at is not null),count(*) filter(where retake_of_session_id is not null) from m;

-- q_coverage
with p as (select user_id,status,covered_count,anchor_count,coverage_pct from public.lead_study_progress limit 100000), a as (select user_id,covered_at,is_stale,cover_source from public.lead_anchor_progress limit 100000) select 'lead_study_progress' metric,count(*) rows,case when count(distinct user_id)>=10 then count(distinct user_id)::text else 'suppressed (<10)' end learners,count(*) filter(where covered_count>anchor_count or coverage_pct<0 or coverage_pct>100) invalid_values,count(*) filter(where anchor_count=0) zero_anchor_rows from p union all select 'lead_anchor_progress',count(*),case when count(distinct user_id)>=10 then count(distinct user_id)::text else 'suppressed (<10)' end,count(*) filter(where is_stale),count(*) filter(where covered_at is null) from a;

-- q_instrumentation
select 'study_journeys' metric,count(*) rows,case when count(distinct user_id)>=10 then count(distinct user_id)::text when count(*)=0 then '0' else 'suppressed (<10)' end learners from (select user_id from public.study_journeys limit 100000) t union all select 'journey_steps',count(*),null from (select id from public.journey_steps limit 100000)t union all select 'journey_execution_blocks',count(*),null from (select id from public.journey_execution_blocks limit 100000)t union all select 'journey_replan_reviews',count(*),null from (select id from public.journey_replan_reviews limit 100000)t union all select 'coaching_engagements',count(*),case when count(distinct candidate_user_id)>=10 then count(distinct candidate_user_id)::text when count(*)=0 then '0' else 'suppressed (<10)' end from (select candidate_user_id from public.coaching_engagements limit 100000)t union all select 'exam_result_uploads',count(*),case when count(distinct user_id)>=10 then count(distinct user_id)::text when count(*)=0 then '0' else 'suppressed (<10)' end from (select user_id from public.exam_result_uploads limit 100000)t union all select 'flashcard_bank_review_log',case when count(distinct user_id)>=10 or count(*)=0 then count(*) else null end,case when count(distinct user_id)>=10 then count(distinct user_id)::text when count(*)=0 then '0' else 'suppressed (<10)' end from (select user_id from public.flashcard_bank_review_log limit 100000)t union all select 'flashcard_review_log',case when count(distinct user_id)>=10 or count(*)=0 then count(*) else null end,case when count(distinct user_id)>=10 then count(distinct user_id)::text when count(*)=0 then '0' else 'suppressed (<10)' end from (select user_id from public.flashcard_review_log limit 100000)t;

-- q_pack
select status,count(*) versions,count(distinct lead_id) leads,count(*) filter(where study_projection is null) missing_projection from (select status,lead_id,study_projection from public.lead_packs limit 100000)t group by status order by status;

-- q_assessment
select count(*) model_item_results,count(*) filter(where is_correct is null) missing_correctness,count(*) filter(where needs_review) flagged_review,count(distinct batch_run_id) runs from (select is_correct,needs_review,batch_run_id from public.lead_assessment_question_results where created_at >= timestamptz '2026-08-01' and created_at < timestamptz '2026-11-06' limit 100000)t;

-- q_latest_pack
with p as (select lead_id,status,study_projection, row_number() over(partition by lead_id order by version desc,created_at desc) rn from public.lead_packs limit 100000) select status,count(*) leads,count(*) filter(where study_projection is null) missing_projection from p where rn=1 group by status order by status;
