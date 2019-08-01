import { Main } from "./main";
import { storage } from "./storage";

storage.load().then(() => {
    new Main();
})
.catch((e) => {
    console.error(e)
    new Main();
})
