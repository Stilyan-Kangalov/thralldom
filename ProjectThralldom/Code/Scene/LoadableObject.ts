module Thralldom {
    export class LoadableObject implements ISelectableObject, IDrawable, ILoadable {
        public id: string;
        public tags: Array<string>;
        public mesh: THREE.Mesh;

        constructor() {
            this.id = null;
            this.tags = [];
        }


        public loadFromDescription(description: any, content: ContentManager): void {
            if (description.tags) {
                this.tags = this.tags.concat(<Array<string>>description.tags);
            }
            if (description.id) {
                this.id = description.id;
            }
        }
    }
}
