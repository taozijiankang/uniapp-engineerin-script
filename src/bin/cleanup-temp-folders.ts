#!/usr/bin/env node
import { cleanupTempHashFolders } from "../utils/cleanupTempFolders.js";

cleanupTempHashFolders(process.cwd());
