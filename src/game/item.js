import Phaser from '/src/libs/phaser.js'

export default class item extends Phaser.GameObjects.Sprite
{
    constructor(scene, x, y, texture) //texture is key for loaded image
    {

        super(scene, x, y, texture)
        this.setScale(0.25)

    }
    

}