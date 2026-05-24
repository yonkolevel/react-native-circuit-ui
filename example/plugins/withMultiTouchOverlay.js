const { withXcodeProject } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

module.exports = function withMultiTouchOverlay(expoConfig) {
  return withXcodeProject(expoConfig, async (config) => {
    const project = config.modResults;
    const sourceDir = path.join(
      __dirname,
      '..',
      '..',
      'ios',
      'MultiTouchOverlay'
    );
    const targetDir = path.join(
      config.modRequest.platformProjectRoot,
      'example'
    );
    const files = [
      'RCTMultiTouchOverlay.swift',
      'RCTMultiTouchOverlayManager.swift',
      'RCTMultiTouchOverlayManager.m',
    ];

    for (const file of files) {
      const src = path.join(sourceDir, file);
      const dst = path.join(targetDir, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dst);
        project.addSourceFile(
          'example/' + file,
          null,
          project.getFirstProject().uuid
        );
      }
    }
    return config;
  });
};
