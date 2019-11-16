# DAI-HRD
DAI: Hodl Rated DAI  -  A DAI token wrapper that benefits from the Dai Savings Rate (interest).

# Development

## Setup
```
npm install --ignore-scripts
```

## Compile the Contracts
```
npm run compile
```
A `build-cache` folder will be created in the root directory that contains both the solc input JSON and the output JSON.  A `generated` folder will also be created in the root directory that contains TypeScript interfaces to the contracts.

## Deploy to Ganache
```
npm run compile
npm run start-ganache
npm run deploy
```

## Test against Ganache
```
npm run compile
npm run test
```

## Web App
```
npm run compile
npm run start-ganache # background, consider using VSCode task
npm run deploy
npx ts-node ./scripts/seed/seed-maker.ts
cd dapp
npm run build
npm run serve # consider background, consider using VSCode task
```
Open http://127.0.0.1:8081/index.html
