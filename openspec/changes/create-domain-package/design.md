## Decisions

- Use the existing scaffold and package generator without invoking a second CLI for the outer workspace.
- Accept JSON from disk or HTTPS and pass a copy of the validated input to the generator.
- Validate the standalone project before remote writes. Use Gitee's enterprise API to create an empty repository and standard Git for SSH transport.
- Persist the spec digest in the source repository and the Gitee operation identity in local Git configuration. Check ownership and refs before retrying writes.
- Keep the Open Artifact integration in the generated product repository and verify its installed behavior in TheFoolAI.
