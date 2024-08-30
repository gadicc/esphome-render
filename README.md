This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Patches

Used so far for `JSCPP`.

1. Edit e.g. `node_modules/JSCPP/...`
1. Stop `yarn dev`, run `rm -rf .next/cache/`, restart `yarn dev`, check that it works.
1. `npx patch-package JSCPP`
1. Commit as per the recommendations.

## Roadmap

NB: this is a pet project in my spare time.

- **Short - medium term**

  - [ ] Implement (correctly) all the ESPHOME home APIs
  - [ ] Work with Top 3 ESPHome projects

- **Long term**

  - [ ] Accounts, ability to share and show user galleries
  - [ ] Ability to move objects in the rendered display with a mouse
        and have those changes reflected back in the code.
  - [ ] Connect to HomeAssistant for real time real usage
  - [ ] Ability to fork shares and rebase your code on upstream updates
  - [ ] Interactive lessons to learn the API
