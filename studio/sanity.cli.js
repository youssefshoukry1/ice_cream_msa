import {defineCliConfig} from "@sanity/cli";
import project from "./project.json" with {type: "json"};

export default defineCliConfig({api: project});
