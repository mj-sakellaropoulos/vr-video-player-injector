import * as THREE from 'three';

export default class VideoProgressBar {
    constructor({
                    videoElement,
                    width = 1.6,
                    height = 0.05,
                    position = new THREE.Vector3(0, -0.1, -2),
                    backgroundColor = 0x444444,
                    fillColor = 0x00ff00
                }) {
        this.video = videoElement;
        this.width = width;

        // Background bar
        const bgGeometry = new THREE.PlaneGeometry(width, height);
        const bgMaterial = new THREE.MeshBasicMaterial({ color: backgroundColor });
        this.bgBar = new THREE.Mesh(bgGeometry, bgMaterial);
        this.bgBar.position.copy(position);

        // Fill bar
        const fillGeometry = new THREE.PlaneGeometry(1, height);
        fillGeometry.translate(0.5, 0, 0); // Anchor left
        const fillMaterial = new THREE.MeshBasicMaterial({ color: fillColor });
        this.fillBar = new THREE.Mesh(fillGeometry, fillMaterial);

        this.fillBar.position.copy(position.clone());
        this.fillBar.position.x -= width / 2; // Align left edge
        this.fillBar.position.z += 0.01; // Avoid z-fighting
        this.fillBar.scale.set(0, 1, 1); // Start at 0% progress
    }

    updateProgress() {
        const progress = this.video.currentTime / this.video.duration || 0;
        this.fillBar.scale.x = progress * this.width;
    }
}
