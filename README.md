## CI

| Check          | Status                                                                                                                |
|----------------|-----------------------------------------------------------------------------------------------------------------------|
| Deploy & tests | ![Deploy & Tests](https://github.com/Sisky/ftr-mono/actions/workflows/deploy-s3.yml/badge.svg)                        |
| Coverage       | [![Coverage](https://codecov.io/gh/Sisky/ftr-mono/branch/main/graph/badge.svg)](https://codecov.io/gh/Sisky/ftr-mono) |

### You have a new requirement to implement for your application: its logic should stay exactly the same but it will need to have a different user interface (e.g. if you wrote a web app, a different UI may be a REPL). Please describe how you would go about implementing this new UI in your application? Would you need to restructure your solution in any way?

The application has been built in a way that there would be no need to change the business logic to introduce a new UI. The codebase already has clear separation of concerns.

- `@ftr-mono/domain` holds `Counter` and domain rules.
- `@ftr-mono/scheduler` provides `createIntervalScheduler` that’s transport-agnostic: it accepts `setIntervalFn` and `clearIntervalFn` so it can run in the browser or Node.
- `@ftr-mono/protocol` defines the message contract: `Command`, `WorkerEvent`, `Snapshot`.
- The React UI uses `useCounterWorker` to speak over `postMessage` to `counterWorker.ts`, which wires domain + scheduler together and emits `SNAPSHOT`, `FIB_ALERT`, `QUIT_ACK`.

This is essentially a Ports-and-Adapters shape:

- **Port:** the `Command`/`Event` API
- **Adapters:** React (UI), Web Worker (runtime/transport)
- **Domain:** the `Counter` and scheduler

The thin React UI layer talks to a runtime adapter (Web Worker) through the protocol defined in `@ftr-mono/protocol`, not directly to the domain.

To add a new UI (CLI / REPL) I would create another adapter that uses the same logic and the same command/event protocol with a different transport (no `postMessage` in a CLI):

- Reuse the domain, scheduler, and protocol packages.
- Create a new adapter `cli-counter.ts` that:
  - Reads user input from stdin.
  - Translates stdin into `Command` types.
  - Calls the existing application logic.
  - Listens to `Snapshot` (and other) events and prints them to the terminal rather than rendering React components.

Because the core logic and protocol are already UI-agnostic, I don’t need to restructure the solution in any major way; I just add a new adapter that plugs into the existing ports.

### You now need to make your application “production ready”, and deploy it so that it can be used by customers. Please describe the steps you’d need to take for this to happen.

I have set up CI/CD with GitHub Actions (`deploy-s3.yml`) to build and deploy the app to S3 + CloudFront. This workflow runs linting, tests, and a coverage job, and only if those succeed does it proceed to build and deploy. To make the application production ready, these are the steps I’d use to confirm readiness:

- **Run tests and checks on every push / Pull Request**
  - Unit tests for domain / worker logic, plus component tests for core UI flows.
  - Linting and (optionally) type-checking as part of the pipeline.
  - Only deploy on green: deployment only runs after these checks pass.

- **Optimised production build**
  - Use `NODE_ENV=production`, minified bundles, tree-shaking, and no dev-only logs.
  - Ensure the worker and React UI are built with production configs.

- **Environment separation**
  - Distinct configs / buckets for `dev` / `staging` / `prod`.
  - Environment-specific API endpoints and feature flags, wired via build-time config.

- **Static hosting**
  - S3 bucket correctly configured for static hosting (index and error documents).
  - SPA routing configured so unknown routes serve `index.html` instead of a raw 404.

- **Security**
  - IAM least privilege: the GitHub Actions role can only target the specific S3 bucket and CloudFront distribution needed for deploy.
  - No AWS keys in the repo, everything through OIDC, GitHub Secrets, and IAM.
  - Check for dependency vulnerabilities using a `pnpm audit` step or GitHub security tooling.
  - HTTPS and custom domain via Route53, CloudFront, and ACM certificate, with HTTP to HTTPS redirects.

- **Monitoring and operations**
  - Use Sentry (or similar) for browser error logging.
  - If applicable, use CloudWatch for more structured logs on the backend.
  - Set up CloudWatch alarms on 4xx/5xx error rates and latency for the CloudFront distribution.
  - Tag releases and configure the Action to deploy from tagged versions or the protected `main` branch.
  - Document how to trigger deploys, where to find logs and metrics, and how to roll back (for example, by re-deploying a previous known-good build).

- **UX**
  - For this demo not alot of time was spent on UI or UX. But for a production release an audit would need to be performed on this.  

### What did you think about this coding test - is there anything you’d suggest in order to improve it?

I enjoyed it. It's been a while I have wanted to try out a few new tools but haven't had the right project to use them with. Vite, Turbo, pnpm workspaces. It's also small enough to build in a reasonable time but rich enough to show design choices. (Separation of domain UI, handling timers, messaging). The second part is nice because it gives an opportunity to explain thinking.

Possibly expectations could be more explicit: how much time you expect candidates to spend. Must-haves vs nice-to-haves (testing, linting, deployment setup). Would have helped calibrate whether this should be a very simple console app or something more structured.

For example, I ended up building a fairly structured solution (separate domain / scheduler / protocol packages + a React UI) which wasn't 100% clear whether that was expected or just bonus. Some kind of time guildline would have made this more obvious.

