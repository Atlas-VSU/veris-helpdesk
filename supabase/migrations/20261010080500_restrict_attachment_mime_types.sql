-- Restrict the attachments storage bucket to JPG, PNG, and PDF files (10MB max).
update storage.buckets
set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'application/pdf']
where id = 'attachments';
