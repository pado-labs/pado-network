import express from 'express';

/**
 * AVS Specification version is the version of the avs node spec that this node is implementing
 * see https://docs.eigenlayer.xyz/eigenlayer/avs-guides/spec/api/#api-versioning
 */
const specVersion = "v0.0.1";
const baseUrl = "/eigen";


export enum NodeHealth {
  /** status:200 - Node is healthy */
  Healthy,
  /** status:206 - Node is partially healthy. It is either initializing or some backing services are not healthy. */
  PartiallyHealthy,
  /** status:503 - Node is unhealthy or having issues. */
  Unhealthy,
};

export enum ServiceStatus {
  Up,
  Down,
  Initializing,
};

export type NodeService = {
  /** Service ID */
  id: string;
  /** Service name */
  name: string;
  /** Service description */
  description: string;
  /** Service status. Possible values are Up, Down, or Initializing. See `ServiceStatus` */
  status: string;
};


export class NodeApi {
  /** Name of the node */
  nodeName: string;
  /** Version of the node */
  nodeVersion: string;
  /** Health of the node */
  nodeHealth: NodeHealth = NodeHealth.Healthy;
  /** Node services */
  nodeServices: NodeService[] = [];

  constructor(nodeName: string = "PADO-AVS", nodeVersion: string = "v1.0.0") {
    this.nodeName = nodeName;
    this.nodeVersion = nodeVersion;
  }

  /**
   * Update the node health
   * @param nodeHealth 
   */
  updateHealth(nodeHealth: NodeHealth) {
    this.nodeHealth = nodeHealth;
  }

  /**
   * Register a new service
   * @param id 
   * @param name 
   * @param description 
   * @param status 
   */
  registerNewService(
    id: string,
    name: string,
    description: string,
    status: ServiceStatus) {
    const nodeService: NodeService = {
      id: id,
      name: name,
      description: description,
      status: ServiceStatus[status],
    };
    this.nodeServices.push(nodeService);
  }

  /**
   * Update service status by id.
   * @param id 
   * @param status 
   * @returns 
   */
  updateServiceStatus(id: string, status: ServiceStatus) {
    for (let i = 0; i < this.nodeServices.length; i++) {
      if (this.nodeServices[i].id == id) {
        this.nodeServices[i].status = ServiceStatus[status];
        return;
      }
    }
  }

  /**
   * Deregister a service by id
   * @param id 
   * @returns 
   */
  deregisterService(id: string) {
    for (let i = 0; i < this.nodeServices.length; i++) {
      if (this.nodeServices[i].id == id) {
        this.nodeServices.splice(i, 1);
        return;
      }
    }
  }


  // https://docs.eigenlayer.xyz/eigenlayer/avs-guides/spec/api/#get-eigennode
  private _nodeHandler(_req: any, res: any) {
    res.json({
      "node_name": this.nodeName,
      "spec_verdsion": specVersion,
      "node_version": this.nodeVersion
    });
  }


  // https://docs.eigenlayer.xyz/eigenlayer/avs-guides/spec/api/#get-eigennodehealth
  private _healthHandler(_req: any, res: any) {
    switch (this.nodeHealth) {
      case NodeHealth.Healthy:
        res.status(200); // StatusOK
        break;
      case NodeHealth.PartiallyHealthy:
        res.status(206); //StatusPartialContent
        break;
      case NodeHealth.Unhealthy:
        res.status(503); //StatusServiceUnavailable
        break;
      default:
        // Return unhealthy if we don't know the health status
        res.status(503);
        break;
    }
    res.end();
  }

  // https://docs.eigenlayer.xyz/eigenlayer/avs-guides/spec/api/#get-eigennodeservices
  private _servicesHandler(_req: any, res: any) {
    res.json({ "services": this.nodeServices });
  }


  // https://docs.eigenlayer.xyz/eigenlayer/avs-guides/spec/api/#get-eigennodeservicesservice_idhealth
  private _serviceHealthHandler(req: any, res: any) {
    const id = req.params.id;
    for (let i = 0; i < this.nodeServices.length; i++) {
      if (this.nodeServices[i].id == id) {
        const status = ServiceStatus[this.nodeServices[i].status as keyof typeof ServiceStatus];
        switch (status) {
          case ServiceStatus.Up:
            res.status(200);
            break;
          case ServiceStatus.Down:
            res.status(503);
            break;
          case ServiceStatus.Initializing:
            res.status(206);
            break;
          default:
            res.status(503);
            break;
        }
        res.end();
        return;
      }
    }
    res.status(404).end();
  }

  start(port: number = 8000) {
    const app = express();

    app.get(baseUrl + "/node", (req, res) => { this._nodeHandler(req, res); });
    app.get(baseUrl + "/node/health", (req, res) => { this._healthHandler(req, res); });
    app.get(baseUrl + "/node/services", (req, res) => { this._servicesHandler(req, res); });
    app.get(baseUrl + "/node/services/:id([a-zA-Z0-9-_]+)/health", (req, res) => { this._serviceHealthHandler(req, res); });

    app.listen(port, () => {
      console.log(`Server is running on port ${port}.`);
    });
  }

};

async function main() {
  const api = new NodeApi();
  api.registerNewService("service-1", "service-1-name", "service-1-desc", ServiceStatus.Initializing)
  api.registerNewService("service-2", "service-2-name", "service-2-desc", ServiceStatus.Up)
  api.registerNewService("service-3", "service-3-name", "service-3-desc", ServiceStatus.Down)
  console.log('1>api', api);
  api.deregisterService("service-2");
  console.log('2>api', api);

  api.start();

  // update status
}
main();
