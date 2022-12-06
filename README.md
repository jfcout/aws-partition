# README

Just Support GCR for SST.

## Install

```shell
npm install sst-gcr --save
```

## CLI

```bash
sst-gcr aws
```

## Use

```typescript
import {Gcr} from "sst-gcr";

export default function main(app: App) {
    Gcr(app);
}
```
