module Thralldom {

    export enum CharacterStates {
        Idle,
        Walking,
        Sprinting,
        Jumping,
        Falling,
        Shooting,
        Dying
    }

    export interface IAnimationData {
        startFrame: number;
        endFrame: number;
    }

    export class Character extends DynamicObject {

        public static defaultSettings: ICharacterSettings;

        public settings: ICharacterSettings;

        public get mesh(): THREE.Mesh {
            return this.skinnedMesh;
        }

        public animation: THREE.Animation;
        public keepPlaying: boolean;

        private skinnedMesh: THREE.SkinnedMesh;
        private hp: number;
        private range: number;
        private damage: number;

        private aiController: AI.AIController;

        public get health(): number {
            return this.hp;
        }

        public set health(value: number) {
            this.hp = value;
        }

        public get isDead(): boolean {
            return this.hp <= 0;
        }

        public stateMachine: StateMachine;
        public animationData: Map<CharacterStates, IAnimationData>;

        constructor() {
            super();

            this.hp = 100;
            this.range = 100;
            this.damage = 1;
            this.settings = Character.defaultSettings;

        }

        public loadFromDescription(description: any, content: ContentManager): void {
            super.loadFromDescription(description, content);

            if (description.model) {
                this.skinnedMesh = content.getContent(description["model"]);
                this.animation = new THREE.Animation(this.skinnedMesh, this.skinnedMesh.geometry.animation.name, THREE.AnimationHandler.LINEAR);

                this.animationData = content.getContent(content.getAnimationFilePath(description.model));
            }

            if (description.pos) {
                this.mesh.position.set(description.pos[0], description.pos[1], description.pos[2]);
            }
            if (description.rot) {
                var rot = description.rot;
                this.mesh.rotation.set(rot[0], rot[1], rot[2]);
            }
            if (description.scale) {
                var scale = description.scale;
                this.mesh.scale.set(scale, scale, scale);
            }
            if (description.ai) {
                var locations: Array<THREE.Vector3> = [
                    new THREE.Vector3(-393.82, 0, 51.73),
                    new THREE.Vector3(90.60330488167114, 0, 120.77182926800373),
                    new THREE.Vector3(-258.4222199467363, 0, 208.32359567890623),
                    new THREE.Vector3(300.4222199467363, 0, 208.32359567890623),
                    new THREE.Vector3(100, 0, -130),
                ];

                var edges: Array<Thralldom.Algorithms.Edge> = [
                    new Algorithms.Edge(0, 1),
                    new Algorithms.Edge(1, 2),
                    new Algorithms.Edge(2, 3),
                    new Algorithms.Edge(3, 4),
                ];

                this.aiController = new AI.Citizen(this, {
                    nodes: locations,
                    edges: edges,
                });
            }

            this.rigidBody = PhysicsManager.computeCapsuleBody(this.mesh, Character.defaultSettings.mass);

            this.stateMachine = StateMachineUtils.getCharacterStateMachine(this);
            
        }

        public attack(enemy: Character, hitPoint: THREE.Intersection): Ammunition {
            // Only attack if the viewing angle between the character and the target is less than Character.MaxViewAngle and the character is in range.
            var distance = new THREE.Vector3();
            distance.subVectors(enemy.mesh.position, this.mesh.position);
            var forwardVector = new THREE.Vector3(0, 0, 1);
            forwardVector.transformDirection(this.mesh.matrix);

            if (distance.length() < this.range && distance.angleTo(forwardVector) < Character.defaultSettings.viewAngle) {
                enemy.health -= this.damage;

            }

            // For now, always shoot a laser.
            var startPoint = new THREE.Vector3();
            startPoint.copy(this.mesh.position).y = 10;
            var laser = new LaserOfDeath(startPoint, hitPoint.point);
            //return laser;

            return undefined;
        }

        public update(delta: number): void {
            if (this.aiController) {
                this.aiController.update(delta);
            }
            this.stateMachine.update(delta);
        }

        public setWalkingVelocity(delta: number, isSprinting: boolean = false): void {
            var forward = new THREE.Vector3(0, 0, 1);
            var multiplier = this.settings.movementSpeed * delta;
            if (isSprinting)
                multiplier *= this.settings.sprintMultiplier;

            forward.transformDirection(this.mesh.matrix).multiplyScalar(multiplier);

            var velocity = this.rigidBody.getLinearVelocity();
            velocity.setX(forward.x);
            velocity.setZ(forward.z);
        }
    }
} 