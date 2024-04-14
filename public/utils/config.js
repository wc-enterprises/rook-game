export const config = {
  type: Phaser.AUTO,
  width: 375,
  height: 667,
  backgroundColor: "#2d2d2d",
  parent: "phaser-example",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};
