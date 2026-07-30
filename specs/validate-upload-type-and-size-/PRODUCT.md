# Product Spec for Validate upload type and size before accepting document storage

## Overview
The goal of this feature is to enhance the security and reliability of the document upload process by validating the type and size of uploaded files before accepting them for storage. This will prevent unauthorized or malicious uploads and ensure that only valid and reasonable-sized files are stored.

## User Stories
* As a user, I want to be restricted from uploading files of arbitrary type and size so that I can ensure the security and integrity of the system.
* As a user, I want to receive an accessible error message when I try to upload an invalid file so that I can understand what went wrong and take corrective action.
* As a system administrator, I want to define and document allowed MIME types/extensions and maximum file size so that I can control what types of files are allowed in the system.

## Requirements
* Define and document allowed MIME types/extensions and maximum file size.
* Reject invalid files in the UI before upload with an accessible error.
* Enforce equivalent constraints server-side using trusted storage metadata.
* Ensure the storage object being registered belongs to the current upload flow and target building owner.
* Delete or reconcile uploads that fail registration.