export default class Connector {
  public options: any;

  constructor(options: string) {
    this.options = options;
  }

  async connect(): Promise<any> {
    return;
  }

  logout(): any {
    return true;
  }

  async isLoggedIn(): Promise<boolean> {
    return true;
  }
}
