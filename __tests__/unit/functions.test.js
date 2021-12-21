const RouterManager = require("../../src/util/services/RouterManager");

describe("Functions auxiliate express", () => {
  it("create groupe routes for requests groupped", async () => {
    const config = {
      api: {
        route: "api/v1/payment",
      },
    };

    const group = new RouterManager({}, {});

    const groupCreated = group.create(config);
    expect(groupCreated).toEqual(config);
  });
});
