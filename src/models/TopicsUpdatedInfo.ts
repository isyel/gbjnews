export class TopicsUpdatedInfo {
  constructor(public category: {}, public topics: any, public topicsCount: number,public updatedSomething:boolean = false,
    public continuation:boolean = false) {}
}
