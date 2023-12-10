# The Big Ol' Todo List
- [ ] Make the liquid mod loader get workshop mod details to fall back onto when a mod is not liquid based
- [ ] Make the LiquidMod class
    - [ ] get settings and storage
- [ ] Make the Liquid Mods button on the title menu wobble depending on the direction the cursor hits it
- [ ] either make `Liquid.on("modLoaded", function(mod) {})` or make `this` into the mod for all the require files
- [ ] make `Liquid.getMod()` work (use the Error stack trace, stackoverflow has example [here](https://stackoverflow.com/questions/16697791/nodejs-get-filename-of-caller-function/29581862#29581862))