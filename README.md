# DAI-HRD
DAI: Hodl Rated DAI  -  A DAI token wrapper that benefits from the Dai Savings Rate (interest).

# Development

## Setup
```
npm install
git update-index --assume-unchanged .\build\contracts\UniswapExchangeTemplate.json .\build\contracts\UniswapFactory.json .\contracts\RuntimeConstants.sol
```
## Build
```
npm run build
```
## Run
Run once and leave running to get ganache development server up and running.
```
npm run start-ganache
```

Run when you want to deploy latest contracts.
```
npm run deploy
```
