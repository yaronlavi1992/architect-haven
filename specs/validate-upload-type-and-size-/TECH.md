# Technical Spec for Validate upload type and size before accepting document storage

## Architecture
The solution will involve enhancements to both the client-side UI and the server-side API. On the client-side, we will add validation logic to check the type and size of uploaded files before sending them to the server. On the server-side, we will add additional validation and enforcement mechanisms to ensure that only valid and authorized files are stored.

## Implementation Steps
* Step 1: Define and document allowed MIME types/extensions and maximum file size.
* Step 2: Implement client-side validation logic to check the type and size of uploaded files.
* Step 3: Implement server-side validation and enforcement mechanisms to ensure that only valid and authorized files are stored.
* Step 4: Ensure the storage object being registered belongs to the current upload flow and target building owner.
* Step 5: Implement logic to delete or reconcile uploads that fail registration.
* Step 6: Develop tests to cover oversized files, spoofed MIME types, unsupported extensions, cross-user building IDs, and valid uploads.