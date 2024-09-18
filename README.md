# PurseToken Subgraph
Subgraph for Purse Token on [pursetoken.com](www.pursetoken.com)

## Getting started
### Clone repository
```
git clone https://github.com/FunctionX-SG/PurseToken_Subgraph.git
```
## With Goldsky
### Install Goldsky CLI
```
curl https://goldsky.com | sh

<or>

curl -fsSL https://cli.goldsky.com/install | bash
```

### Login
You will be prompted to enter your Goldsky API token after.
```
goldsky login
```

### Migrate or deploy subgraph
If already using a publicly available subgraph, you can pass the GraphQL URL endpoint via `--from-url`. Your GraphQL URL endpoint could look something like: `https://api.studio.thegraph.com/subgraphs/name/pooltogether/pooltogether`.
```
goldsky subgraph deploy your-subgraph-name/your-version --from-url <your-subgraph-query-url>
```

### Deploy from source code
If deploying from source, `cd` into the root of the repository.
```
yarn codegen
yarn build
goldsky subgraph deploy your-subgraph-name/your-version --path .
```

## With The Graph
### Install, run codegen, and build
```
yarn install
yarn codegen
yarn build
```

## Development
To deploy and run the subgraph on the network, please follow the following steps:
### Install Graph CLI with either npm or yarn
```
npm install -g @graphprotocol/graph-cli

<or>

yarn global add @graphprotocol/graph-cli
```

### Authenticate
```
graph auth --studio <deploy-key>
```

### Build subgraph
```
graph codegen && graph build
```

### Deploy subgraph to Subgraph Studio
If you created a subgraph on Subgraph Studio, `subgraph_slug` should be the same as the one you created.
```
graph deploy --studio <subgraph_slug>
```