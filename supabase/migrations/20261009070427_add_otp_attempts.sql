-- Count wrong OTP tries. A code is locked after 5 wrong tries.
alter table otp_verifications
  add column attempts integer not null default 0;

-- Store ticket emails in lowercase, so they match the lowercase
-- emails used by OTP and the client session.
-- Only rows that are not already clean are changed.
update tickets
  set email = lower(trim(email))
  where email <> lower(trim(email));