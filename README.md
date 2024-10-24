# Liquid

Liquid is a Mods Menu and set of functions designed to simplify the modding process. That is it, it is purely bindings to pieces of code most frequently extended. If you would like to contribute, please submit a pull request, but I am quite particular about how functions are implemented.

## Documentation

Documentation on this mod can be found [here](https://tfe2-modding.github.io/liquid)

---

To whoever picks up this project:

Part of where I went wrong with the original Liquid, the Graphene Loader, or even WaterWorks, was I kept trying to abstract and categorize stuff. I was too busy making stuff just because I could, prioritizing doing specific things with the least amount of steps possible, and categorizing everything before it existed to actually pay attention to making anything vaguely functional. The reason I tend to shy away from using game engines and instead use frameworks and as little libraries as possible is because libraries and engines tend to abstract away a large portion of how things work, which means if I want to do something specific, I usually can't without some hacky solution, and in my rush to try and simplify things I made the exact thing I would never use in any of my projects: an overly verbose, cluttered, useless set of functions preemptively dropped into categories before anything was properly made. Furthermore, I would envision huge systems for acomplishing tasks such as creating windows that involved a lot of overhead, that in the end, wouldn't be much simpler than just doing it manually and would only be more bloat. And then I would go on to document none of it, making all of my hard work useless.

So: whoever is working on this project now, please. Keep it simple. Do not categorize, just name things in a way that make sense. New Liquid functions should only reduce the typing needed to do something in the vanilla game, not the functionality provided. The goal of this project is simply to reduce the amount of times a modder would need to manually extend functions in the average mod. Simplify but do not abstract. And document everything, because all your work will be for nothing if no one knows how to use it.

Liquid should make modding easier simply by giving people knowledge and easy access to parts of the code by creating "bindings" and documenting those bindings, not by abstracting away all the complexity this game has.
