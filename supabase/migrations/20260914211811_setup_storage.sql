insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
values (
  'attachments', 
  'attachments', 
  false, 
  10485760, 
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
);
