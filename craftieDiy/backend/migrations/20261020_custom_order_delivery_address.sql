-- Custom orders keep the selected saved address, matching normal orders.
-- Existing custom orders remain valid with a NULL address_id.
ALTER TABLE custom_orders
    ADD COLUMN address_id INT NULL,
    ADD CONSTRAINT fk_custom_orders_address_id
        FOREIGN KEY (address_id) REFERENCES addresses(id);
