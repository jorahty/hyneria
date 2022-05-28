class Point {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

class Cube {
  constructor(x, y, z, r) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.r = r;
  }

  contains(point) {
    return (
      point.x <= this.x + this.r &&
      point.x >= this.x - this.r &&
      point.y <= this.y + this.r &&
      point.y >= this.y - this.r &&
      point.z <= this.z + this.r &&
      point.z >= this.z - this.r
    );
  }

  intersects(other) {
    return !(
      other.x - other.r > this.x + this.r ||
      other.x + other.r < this.x - this.r ||
      other.y - other.r > this.y + this.r ||
      other.y + other.r < this.y - this.r ||
      other.z - other.r > this.z + this.r ||
      other.z + other.r < this.z - this.r
    );
  }
}

class OcTree {
  constructor(bin, n) {
    this.bin = bin;
    this.capacity = n;
    this.points = [];
    this.divided = false;
  }

  divide() { // create 8 children
    let x = this.bin.x;
    let y = this.bin.y;
    let z = this.bin.z;
    let r = this.bin.r;

    let trf = new Cube(x + r/2, y + r/2, z + r/2, r/2);
    let tlf = new Cube(x - r/2, y + r/2, z + r/2, r/2);
    let blf = new Cube(x - r/2, y - r/2, z + r/2, r/2);
    let brf = new Cube(x + r/2, y - r/2, z + r/2, r/2);
    let trb = new Cube(x + r/2, y + r/2, z - r/2, r/2);
    let tlb = new Cube(x - r/2, y + r/2, z - r/2, r/2);
    let blb = new Cube(x - r/2, y - r/2, z - r/2, r/2);
    let brb = new Cube(x + r/2, y - r/2, z - r/2, r/2);

    this.topRightFront = new OcTree(trf, this.capacity);
    this.topLeftFront = new OcTree(tlf, this.capacity);
    this.bottomLeftFront = new OcTree(blf, this.capacity);
    this.bottomRightFront = new OcTree(brf, this.capacity);
    this.topRightBack = new OcTree(trb, this.capacity);
    this.topLeftBack = new OcTree(tlb, this.capacity);
    this.bottomLeftBack = new OcTree(blb, this.capacity);
    this.bottomRightBack = new OcTree(brb, this.capacity);

    this.divided = true;
  }

  insert(point) {

    if (this.bin.contains(point) == false) return false; // abort

    if (this.points.length < this.capacity && !this.divided) {
      this.points.push(point); // base case
      return true;
    }

    if (this.divided == false) this.divide(); // divide if needed

    // recursive case
    if (this.topRightFront.insert(point)) return true;
    if (this.topLeftFront.insert(point)) return true;
    if (this.bottomLeftFront.insert(point)) return true;
    if (this.bottomRightFront.insert(point)) return true;
    if (this.topRightBack.insert(point)) return true;
    if (this.topLeftBack.insert(point)) return true;
    if (this.bottomLeftBack.insert(point)) return true;
    if (this.bottomRightBack.insert(point)) return true;

    return false;
  }

  delete(point) {
    if (this.bin.contains(point) == false) return false;

    // search for point in this.points
    // if found, delete and return true
    for (let i = this.points.length - 1; i >= 0; i--) {
      let p = this.points[i];
      if (p.x == point.x && p.y == point.y && p.z == point.z) {
        this.points.splice(i, 1);
        return true;
      }
    }

    if (this.divided == false) return false;

    if (this.topRightFront.delete(point)) return true;
    if (this.topLeftFront.delete(point)) return true;
    if (this.bottomLeftFront.delete(point)) return true;
    if (this.bottomRightFront.delete(point)) return true;
    if (this.topRightBack.delete(point)) return true;
    if (this.topLeftBack.delete(point)) return true;
    if (this.bottomLeftBack.delete(point)) return true;
    if (this.bottomRightBack.delete(point)) return true;

    return false;
  }

  query(range) {

    let inRange = []; // prepare array of results

    if (this.bin.intersects(range) == false) return inRange; // abort

    for (let p of this.points) { // add points at this octant level
      if (range.contains(p)) inRange.push(p);
    }

    if (this.divided == false) return inRange; // abort if no children

    // add points from children
    inRange = inRange.concat(this.topRightFront.query(range));
    inRange = inRange.concat(this.topLeftFront.query(range));
    inRange = inRange.concat(this.bottomLeftFront.query(range));
    inRange = inRange.concat(this.bottomRightFront.query(range));
    inRange = inRange.concat(this.topRightBack.query(range));
    inRange = inRange.concat(this.topLeftBack.query(range));
    inRange = inRange.concat(this.bottomLeftBack.query(range));
    inRange = inRange.concat(this.bottomRightBack.query(range));

    return inRange;
  }
}

module.exports = { Point, Cube, OcTree };