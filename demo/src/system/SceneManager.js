/**
 * @file SceneManager.js
 * @description Singleton scene manager that handles transitions between
 *   PixiJS scenes using GSAP fade animations.
 */

import { Container } from 'pixi.js';
import gsap from 'gsap';

/**
 * Manages PixiJS scene lifecycle and animated transitions.
 *
 * Usage:
 *   sceneManager.init(pixiApp);
 *   await sceneManager.switchTo(TitleScene, { someData: true });
 *
 * Scene classes must implement:
 *   - constructor(data) → should create/populate a Container (this.container)
 *   - destroy()         → clean up resources
 */
class SceneManager {
  constructor() {
    /** @type {Container|null} Currently active scene container */
    this.currentScene = null;

    /** @type {Container|null} Transition wrapper container to avoid mutating scene containers directly */
    this.transitionContainer = null;

    /** @type {import('pixi.js').Application|null} PixiJS application reference */
    this.app = null;
  }

  /**
   * Initialise the manager with a PixiJS Application instance.
   * Must be called once before any switchTo() call.
   * @param {import('pixi.js').Application} pixiApp
   */
  init(pixiApp) {
    this.app = pixiApp;
  }

  /**
   * Transition to a new scene with a crossfade.
   *
   * 1. Fades out the current scene (alpha → 0, 0.3 s).
   * 2. Destroys the current scene.
   * 3. Instantiates the new SceneClass with `data`.
   * 4. Adds the new scene's container to the stage and fades in (alpha 0 → 1, 0.3 s).
   *
   * @param {new (data:Object) => {container:Container, destroy:Function}} SceneClass
   * @param {Object} [data={}] - Data forwarded to the scene constructor.
   * @returns {Promise<void>}
   */
  async switchTo(SceneClass, data = {}) {
    if (!this.app) {
      throw new Error('[SceneManager] Not initialised – call init(app) first.');
    }

    // ── Fade out & destroy current scene ─────────────────────────────────
    if (this.currentScene) {
      if (this.currentScene.container) {
        this.currentScene.container.eventMode = 'none';
        this.currentScene.container.interactiveChildren = false;
      }

      // Animate the transition wrapper container instead of the scene container
      // to avoid mutating containers with direct Graphics children
      const fadeContainer = this.transitionContainer || this.currentScene.container;

      await gsap.to(fadeContainer, {
        alpha: 0,
        duration: 0.3,
        ease: 'power2.inOut',
      });

      this.app.stage.removeChild(fadeContainer);
      this.currentScene.destroy();
      this.currentScene = null;
      this.transitionContainer = null;
    }

    // ── Create & fade in new scene ───────────────────────────────────────
    const newScene = new SceneClass(data);
    
    // Create a plain transition wrapper container that contains the scene
    const transitionContainer = new Container();
    transitionContainer.enableRenderGroup();
    transitionContainer.alpha = 0;

    if (newScene.container) {
      newScene.container.enableRenderGroup();
    }
    
    transitionContainer.addChild(newScene.container);
    
    this.app.stage.addChild(transitionContainer);

    await gsap.to(transitionContainer, {
      alpha: 1,
      duration: 0.3,
      ease: 'power2.inOut',
    });

    this.currentScene = newScene;
    this.transitionContainer = transitionContainer;
  }

  /**
   * Get the currently active scene instance.
   * @returns {Object|null}
   */
  getCurrentScene() {
    return this.currentScene;
  }
}

/** Singleton instance */
export const sceneManager = new SceneManager();
