# Tag Classes a plugin for Obsidian

Style your notes based on their tags without having to manually add a `cssclasses` to the frontmatter.

Tag Classes automatically injects your note's tags as CSS classes on the view container, 
so you can target any note from a CSS snippet using nothing but its tags.

If you already use tags to organize your notes, then you're not forced to also add a `cssclasses` property just to style them. 
Tag Classes automatically turns your existing tags into CSS classes, so your tags do double duty.

---

## How it works

Every tag on a note gets added as a CSS class on the view container.
A note tagged `#recipe` gets the class `.tag-recipe`. That's it.

A note with these tags:

```yaml
---
tags: [recipe, italian]
---
```

...will have these classes added to its view container:

```
.tag-recipe  .tag-italian
```

You can then style it from any CSS snippet in `.obsidian/snippets/`:

```css
.tag-recipe .markdown-preview-view {
  background: #fffbf5;
  font-family: Georgia, serif;
}

.tag-recipe h1, .tag-recipe h2 {
  color: #c0392b;
}
```

No `cssclasses` in the frontmatter needed. Your tags are enough.

---

## Installation

### From the Community Plugin store

1. Open **Settings → Community plugins**
2. Search for **Tag Classes**
3. Install and enable

### Manual installation

1. Download `main.js` and `manifest.json` from the [latest release](../../releases/latest)
2. Create a folder at `<your-vault>/.obsidian/plugins/tag-classes/`
3. Copy both files into that folder
4. Reload Obsidian and enable the plugin under **Settings → Community plugins**

---

## Usage

Once enabled, tags are automatically applied as classes — nothing else to configure.

### Targeting notes in CSS snippets

Create a file in `.obsidian/snippets/` (e.g. `tag-styles.css`):

```css
/* Notes tagged #recipe */
.tag-recipe .markdown-preview-view {
  background: #fffbf5;
  font-family: Georgia, serif;
}

/* Notes tagged #draft — add a visual watermark */
.tag-draft .markdown-preview-view::before {
  content: "DRAFT";
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-30deg);
  font-size: 6rem;
  font-weight: 900;
  color: rgba(0, 0, 0, 0.04);
  pointer-events: none;
}

/* Notes tagged #important — colored left border */
.tag-important .markdown-preview-view {
  border-left: 4px solid #f59e0b;
  padding-left: 1rem;
}

/* Subtag #project/personal → .tag-project-personal */
.tag-project-personal h1 {
  color: #7c3aed;
}
```

Enable your snippet under **Settings → Appearance → CSS snippets**.

---

## Settings

| Setting | Default | Description |
|---|---|---|
| **CSS prefix** | `tag-` | Prefix prepended to every tag name. A tag `recipe` becomes class `tag-recipe`. |
| **Sanitize class names** | `true` | Replaces characters invalid in CSS (e.g. `/` in subtags) with `-`. Disable if you want raw tag names. |

## License

MIT
