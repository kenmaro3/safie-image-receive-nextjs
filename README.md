# seal-wasm-example

Example of SEAL running on wasm

## Getting Started

### Development Server

To start the development server, run:

```bash
# recommended
docker-compose up --build

# or 
npm install && npm run dev

# or
yarn install && yarn dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

You can start editing the page by modifying `pages/*.tsx`. The page will be updated automatically as you edit the file.

### Production Server

To start the production server, run:

```bash
# recommended
docker-compose up demo-prod --build

# or 
npm install && npm run build && npm run start

# or
yarn install && yarn run build && yarn run start
```

If you used Docker option, the server will start on the port `80`, otherwise `3000` (same as development).

## Use development environment

To start working with this repository, you need to use Devcontainer.

1. Open this repository in Visual Studio Code.
2. From the Command Pallete, select *Remote-Containers: Open Folder in Container...* and open this repository.
3. After build, VSCode's window releoads and opens the folder inside a container.

