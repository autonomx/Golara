# Production Security Release Communications

This document gives operators a lightweight communication checklist for security-sensitive production releases, rollbacks, and hotfixes.

Use it with the production security deployment checklist, incident response runbook, release sign-off template, and any active rollback or external-check notes.

## Communication goals

1. Make release state clear to owners, operators, support, and stakeholders.
2. Keep sensitive operational evidence out of chat, tickets, and public messages.
3. Record who is responsible for each communication and when follow-up is required.
4. Avoid over-sharing unconfirmed security details before triage is complete.

## Pre-release communication checklist

Before a security-sensitive release:

- Confirm the release owner and backup owner.
- Confirm the deployment window and expected customer-visible impact.
- Confirm the channel for release coordination.
- Confirm where bounded release evidence will be recorded.
- Confirm whether support or operations needs a prepared status note.
- Confirm whether payment, abuse, media, dependency, or session-policy decisions need explicit stakeholder approval.

## During-release communication checklist

During deployment or rollback:

- Post start time, release identifier, and responsible owner in the coordination channel.
- Record check status using links or short summaries rather than pasted logs.
- Escalate only confirmed blockers or high-confidence risk signals.
- Assign a single owner for customer/support-facing wording if communication becomes necessary.
- Keep the release status current until completion, rollback, or paused state is declared.

## Post-release communication checklist

After the release:

- Record final release state: completed, rolled back, hotfixed, paused, or accepted risk.
- Record the final validation window and owner.
- Summarize monitoring outcomes using bounded evidence.
- List follow-up tasks with owners and due dates.
- Update the release evidence index or sign-off record with the final communication summary.

## Customer/support-facing note template

Use this only when customer or support communication is required.

```text
Status: [monitoring / resolved / investigating]
Impact: [brief customer-visible impact]
Time window: [start/end or ongoing]
Action taken: [release / rollback / hotfix / monitoring]
Next update: [time or condition]
Owner: [role/team]
```

Do not include internal implementation details, raw logs, secrets, credentials, private customer data, provider payloads, or exploit details in customer/support-facing notes.

## Internal handoff fields

For operator handoffs, record:

- Release or PR identifier.
- Production deployment identifier, if available.
- GitHub CI run and check status.
- External provider status, if relevant.
- Release owner and backup owner.
- Current state and next decision point.
- Follow-up tasks and owners.

## Review cadence

Review this communication checklist before major production launches and after security incidents or rollback/hotfix events.
