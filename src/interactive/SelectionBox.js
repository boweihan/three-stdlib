import { Frustum, Vector3 } from 'three'

const frustum = /* @__PURE__ */ new Frustum()
const center = /* @__PURE__ */ new Vector3()

const tmpPoint = /* @__PURE__ */ new Vector3()

const vecNear = /* @__PURE__ */ new Vector3()
const vecTopLeft = /* @__PURE__ */ new Vector3()
const vecTopRight = /* @__PURE__ */ new Vector3()
const vecDownRight = /* @__PURE__ */ new Vector3()
const vecDownLeft = /* @__PURE__ */ new Vector3()

const vecFarTopLeft = /* @__PURE__ */ new Vector3()
const vecFarTopRight = /* @__PURE__ */ new Vector3()
const vecFarDownRight = /* @__PURE__ */ new Vector3()
const vecFarDownLeft = /* @__PURE__ */ new Vector3()

const vectemp1 = /* @__PURE__ */ new Vector3()
const vectemp2 = /* @__PURE__ */ new Vector3()
const vectemp3 = /* @__PURE__ */ new Vector3()

class SelectionBox {
  constructor(camera, scene, deep) {
    this.camera = camera
    this.scene = scene
    this.startPoint = new Vector3()
    this.endPoint = new Vector3()
    this.collection = []
    this.deep = deep || Number.MAX_VALUE
  }

  select(startPoint, endPoint) {
    this.startPoint = startPoint || this.startPoint
    this.endPoint = endPoint || this.endPoint
    this.collection = []

    this.updateFrustum(this.startPoint, this.endPoint)
    this.searchChildInFrustum(frustum, this.scene)

    return this.collection
  }

  updateFrustum(startPoint, endPoint) {
    startPoint = startPoint || this.startPoint
    endPoint = endPoint || this.endPoint

    // Avoid invalid frustum

    if (startPoint.x === endPoint.x) {
      endPoint.x += Number.EPSILON
    }

    if (startPoint.y === endPoint.y) {
      endPoint.y += Number.EPSILON
    }

    this.camera.updateProjectionMatrix()
    this.camera.updateMatrixWorld()

    if (this.camera.isPerspectiveCamera) {
      tmpPoint.copy(startPoint)
      tmpPoint.x = Math.min(startPoint.x, endPoint.x)
      tmpPoint.y = Math.max(startPoint.y, endPoint.y)
      endPoint.x = Math.max(startPoint.x, endPoint.x)
      endPoint.y = Math.min(startPoint.y, endPoint.y)

      vecNear.setFromMatrixPosition(this.camera.matrixWorld)
      vecTopLeft.copy(tmpPoint)
      vecTopRight.set(endPoint.x, tmpPoint.y, 0)
      vecDownRight.copy(endPoint)
      vecDownLeft.set(tmpPoint.x, endPoint.y, 0)

      vecTopLeft.unproject(this.camera)
      vecTopRight.unproject(this.camera)
      vecDownRight.unproject(this.camera)
      vecDownLeft.unproject(this.camera)

      vectemp1.copy(vecTopLeft).sub(vecNear)
      vectemp2.copy(vecTopRight).sub(vecNear)
      vectemp3.copy(vecDownRight).sub(vecNear)
      vectemp1.normalize()
      vectemp2.normalize()
      vectemp3.normalize()

      vectemp1.multiplyScalar(this.deep)
      vectemp2.multiplyScalar(this.deep)
      vectemp3.multiplyScalar(this.deep)
      vectemp1.add(vecNear)
      vectemp2.add(vecNear)
      vectemp3.add(vecNear)

      var planes = frustum.planes

      planes[0].setFromCoplanarPoints(vecNear, vecTopLeft, vecTopRight)
      planes[1].setFromCoplanarPoints(vecNear, vecTopRight, vecDownRight)
      planes[2].setFromCoplanarPoints(vecDownRight, vecDownLeft, vecNear)
      planes[3].setFromCoplanarPoints(vecDownLeft, vecTopLeft, vecNear)
      planes[4].setFromCoplanarPoints(vecTopRight, vecDownRight, vecDownLeft)
      planes[5].setFromCoplanarPoints(vectemp3, vectemp2, vectemp1)
      planes[5].normal.multiplyScalar(-1)
    } else if (this.camera.isOrthographicCamera) {
      const left = Math.min(startPoint.x, endPoint.x)
      const top = Math.max(startPoint.y, endPoint.y)
      const right = Math.max(startPoint.x, endPoint.x)
      const down = Math.min(startPoint.y, endPoint.y)

      vecTopLeft.set(left, top, -1)
      vecTopRight.set(right, top, -1)
      vecDownRight.set(right, down, -1)
      vecDownLeft.set(left, down, -1)

      vecFarTopLeft.set(left, top, 1)
      vecFarTopRight.set(right, top, 1)
      vecFarDownRight.set(right, down, 1)
      vecFarDownLeft.set(left, down, 1)

      vecTopLeft.unproject(this.camera)
      vecTopRight.unproject(this.camera)
      vecDownRight.unproject(this.camera)
      vecDownLeft.unproject(this.camera)

      vecFarTopLeft.unproject(this.camera)
      vecFarTopRight.unproject(this.camera)
      vecFarDownRight.unproject(this.camera)
      vecFarDownLeft.unproject(this.camera)

      var planes = frustum.planes

      planes[0].setFromCoplanarPoints(vecTopLeft, vecFarTopLeft, vecFarTopRight)
      planes[1].setFromCoplanarPoints(vecTopRight, vecFarTopRight, vecFarDownRight)
      planes[2].setFromCoplanarPoints(vecFarDownRight, vecFarDownLeft, vecDownLeft)
      planes[3].setFromCoplanarPoints(vecFarDownLeft, vecFarTopLeft, vecTopLeft)
      planes[4].setFromCoplanarPoints(vecTopRight, vecDownRight, vecDownLeft)
      planes[5].setFromCoplanarPoints(vecFarDownRight, vecFarTopRight, vecFarTopLeft)
      planes[5].normal.multiplyScalar(-1)
    } else {
      console.error('THREE.SelectionBox: Unsupported camera type.')
    }
  }

  searchChildInFrustum(frustum, object) {
    if (object.isMesh || object.isLine || object.isPoints) {
      if (object.material !== undefined) {
        if (object.geometry.boundingSphere === null) object.geometry.computeBoundingSphere()

        center.copy(object.geometry.boundingSphere.center)

        center.applyMatrix4(object.matrixWorld)

        if (frustum.containsPoint(center)) {
          this.collection.push(object)
        }
      }
    }

    if (object.children.length > 0) {
      for (let x = 0; x < object.children.length; x++) {
        this.searchChildInFrustum(frustum, object.children[x])
      }
    }
  }
}

export { SelectionBox }
