import { installChunkRecovery } from "./lib/chunkRecovery";

// Imported before App/routes so initial lazy route loads are covered too.
installChunkRecovery(window);
