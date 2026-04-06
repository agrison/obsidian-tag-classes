import {
  App,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
  WorkspaceLeaf,
  MarkdownView,
} from "obsidian";

interface TagClassesSettings {
  prefix: string;
  sanitize: boolean;
}

const DEFAULT_SETTINGS: TagClassesSettings = {
  prefix: "tag-",
  sanitize: true,
};

export default class TagClassesPlugin extends Plugin {
  settings: TagClassesSettings;

  async onload() {
    await this.loadSettings();

    this.app.workspace.onLayoutReady(() => {
      this.updateAllLeaves();
    });

    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        if (leaf) this.updateLeaf(leaf);
      })
    );

    this.registerEvent(
      this.app.metadataCache.on("changed", (file) => {
        this.updateLeavesForFile(file);
      })
    );

    this.registerEvent(
      this.app.workspace.on("file-open", (_file) => {
        const leaf = this.app.workspace.getActiveViewOfType(MarkdownView)?.leaf;
        if (leaf) this.updateLeaf(leaf);
      })
    );

    this.addSettingTab(new TagClassesSettingTab(this.app, this));
  }

  onunload() {
    this.app.workspace.iterateAllLeaves((leaf) => {
      this.clearTagClasses(leaf);
    });
  }

  // ─── Core ────────────────────────────────────────────────────

  private getTagsForFile(file: TFile): string[] {
    const cache = this.app.metadataCache.getFileCache(file);
    if (!cache) return [];

    const tags = new Set<string>();

    const frontmatterTags = cache.frontmatter?.tags;
    if (frontmatterTags) {
      const arr = Array.isArray(frontmatterTags)
        ? frontmatterTags
        : [frontmatterTags];
      arr.forEach((t: unknown) => {
        if (typeof t === "string") tags.add(t);
      });
    }

    if (cache.tags) {
      cache.tags.forEach((tagCache) => {
        tags.add(tagCache.tag.replace(/^#/, ""));
      });
    }

    return Array.from(tags);
  }

  private tagToClass(tag: string): string {
    const prefixed = `${this.settings.prefix}${tag}`;
    if (!this.settings.sanitize) return prefixed;
    // sanitize
    return prefixed.replace(/[^a-zA-Z0-9_-]/g, "-");
  }

  private getInjectedClasses(el: HTMLElement): string[] {
    return Array.from(el.classList).filter((c) =>
      c.startsWith(this.settings.prefix)
    );
  }

  private clearTagClasses(leaf: WorkspaceLeaf) {
    const container = this.getLeafContainer(leaf);
    if (!container) return;
    this.getInjectedClasses(container).forEach((c) =>
      container.classList.remove(c)
    );
  }

  private getLeafContainer(leaf: WorkspaceLeaf): HTMLElement | null {
    // targets .view-content
    const view = leaf.view;
    if (!view || !(view instanceof MarkdownView)) return null;
    return view.containerEl;
  }

  private updateLeaf(leaf: WorkspaceLeaf) {
    const view = leaf.view;
    if (!(view instanceof MarkdownView)) return;

    const file = view.file;
    const container = this.getLeafContainer(leaf);
    if (!container || !file) {
      this.clearTagClasses(leaf);
      return;
    }

    const tags = this.getTagsForFile(file);
    const newClasses = tags.map((t) => this.tagToClass(t));

    this.getInjectedClasses(container).forEach((c) => {
      if (!newClasses.includes(c)) container.classList.remove(c);
    });

    newClasses.forEach((c) => container.classList.add(c));
  }

  private updateAllLeaves() {
    this.app.workspace.iterateAllLeaves((leaf) => this.updateLeaf(leaf));
  }

  private updateLeavesForFile(file: TFile) {
    this.app.workspace.iterateAllLeaves((leaf) => {
      const view = leaf.view;
      if (view instanceof MarkdownView && view.file?.path === file.path) {
        this.updateLeaf(leaf);
      }
    });
  }

  // ─── Persistance  ──────────────────────────────────────────────────
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.updateAllLeaves();
  }
}

// ─── Settings panel ──────────────────────────────────────────────────────

class TagClassesSettingTab extends PluginSettingTab {
  plugin: TagClassesPlugin;

  constructor(app: App, plugin: TagClassesPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Tag Classes")
      .setHeading();

    new Setting(containerEl)
      .setName("CSS prefix")
      .setDesc(
        'Prefix added before each tag. Default "tag-" → class "tag-myTag".'
      )
      .addText((text) =>
        text
          .setPlaceholder("tag-")
          .setValue(this.plugin.settings.prefix)
          .onChange(async (value) => {
            this.plugin.settings.prefix = value || "tag-";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Sanitise class names")
      .setDesc(
        'Replace invalid CSS characters (e.g., "/" in sub-tags) with "-".'
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.sanitize)
          .onChange(async (value) => {
            this.plugin.settings.sanitize = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Usage")
      .setHeading();
    
    containerEl.createEl("p", {
      text: 'The tags of each note are automatically added as CSS classes on the view container. Example: a tag "projet" becomes the class "tag-projet".',
    });

    const pre = containerEl.createEl("pre");
    pre.createEl("code", {
      text: `/* Style a note with the tag "coding" */
.tag-coding .markdown-preview-view h1 {
  color: blue;
  font-family: Georgia, serif;
}

/* Other tag "projects/car" → classe "tag-projects-car" */
.tag-projects-car h1 {
  color: orange;
}`,
    });
  }
}
