import type { Tables } from './database';

export type Campaign = Tables<'campaigns'>;
export type Prospect = Tables<'prospects'>;
export type Audit = Tables<'audits'>;
export type Score = Tables<'scores'>;
export type AuraAction = Tables<'aura_actions'>;
export type OutreachAttempt = Tables<'outreach_attempts'>;
export type OutreachContext = Tables<'outreach_context'>;
export type Conversation = Tables<'conversations'>;
export type ApprovalQueueItem = Tables<'approval_queue'>;
