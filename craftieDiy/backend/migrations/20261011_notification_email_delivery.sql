-- Apply once to the existing MySQL database before deploying the updated model.
ALTER TABLE notifications
    ADD COLUMN idempotency_key VARCHAR(80) NULL,
    ADD COLUMN email_status VARCHAR(20) NULL,
    ADD COLUMN email_error TEXT NULL;

ALTER TABLE notifications
    ADD CONSTRAINT uq_notifications_user_idempotency_key
    UNIQUE (user_id, idempotency_key);
