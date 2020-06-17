import { Main } from "./main";
import { storage } from "./storage";
import { Pollyfills } from "./pollyfills"

storage.load().then(() => {
    new Main();
    Pollyfills.apply();
})
.catch((e) => {
    console.error(e)
    new Main();
})
