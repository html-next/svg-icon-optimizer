@html-next/svg-icon-optimizer
==============================================================================

**SVG Icon Performance Optimization**

This addon lets ember app's progressively opt in to highly optimized icon
usage via a combination of embroider, template-only components, and build-time
plugins.

**TL;DR**

- Put svg icons in your app as template-only components `app/components/icon/**/*.hbs`
- Use icons in your app as a regular component e.g. `<Icon::Fa::Trashcan />`

**Optimizations**

- 1. less-repetitive inline-svg usage - which keeps your payloads smaller. You get this just by using icons as components. You don't even need this addon for that <3 !
- 2. tree-shake unused icons. You get this purely by using embroider for your build, no other configuration required! You don't even need this addon for that <3 !
- 3. don't ship SVGs as JS code. Using this addon your SVGs will be extracted to `public/assets/component-icons/**/*.svg`. This reduces the JS bundle size and allows for these images to be served from cache. We'll even keep a stable fingerprint for them between builds if they haven't changed. The magic here is `use`, your components are converted into this still tree-shakeable form:

```hbs
<svg ...attributes xmlns="http://www.w3.org/2000/svg">
  <use xlink:href="assets/component-icons/fa/trashcan.svg"></use>
</svg>
```

This form allows us to re-use SVG images and cache them while retaining the ability to style them inline.

- 4. Automatically convert only the used SVGs into symbols and a sprite. We'll parse your templates and find which icons were actually used, then create a sprite for them. The output from the optimization in step-3 changes to:

```hbs
<svg ...attributes xmlns="http://www.w3.org/2000/svg">
  <use xlink:href="assets/component-icon-sprite.svg#fa-trashcan"></use>
</svg>
```


Compatibility
------------------------------------------------------------------------------

* Ember.js v3.24 or above
* Ember CLI v3.24 or above
* Node.js v12 or above


Installation
------------------------------------------------------------------------------

```
ember install @html-next/svg-icon-optimizer
```


Usage
------------------------------------------------------------------------------

[Longer description of how to use the addon in apps.]


Contributing
------------------------------------------------------------------------------

See the [Contributing](CONTRIBUTING.md) guide for details.


License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
