import { Dispatch } from "redux";
import { createAction, getReturnOfExpression } from "typesafe-actions";

import { IClusterServiceClass } from "../shared/ClusterServiceClass";
import { IServiceBinding, ServiceBinding } from "../shared/ServiceBinding";
import { IServiceBroker, IServicePlan, ServiceCatalog } from "../shared/ServiceCatalog";
import { IServiceInstance, ServiceInstance } from "../shared/ServiceInstance";
import { IStoreState } from "../shared/types";

export const checkCatalogInstall = createAction("CHECK_INSTALL");
export const installed = createAction("INSTALLED");
export const notInstalled = createAction("_NOT_INSTALLED");
export const requestBrokers = createAction("REQUEST_BROKERS");
export const receiveBrokers = createAction("RECEIVE_BROKERS", (brokers: IServiceBroker[]) => ({
  brokers,
  type: "RECEIVE_BROKERS",
}));
export const requestPlans = createAction("REQUEST_PLANS");
export const receivePlans = createAction("RECEIVE_PLANS", (plans: IServicePlan[]) => ({
  plans,
  type: "RECEIVE_PLANS",
}));
export const requestInstances = createAction("REQUEST_INSTANCES");
export const receiveInstances = createAction(
  "RECEIVE_INSTANCES",
  (instances: IServiceInstance[]) => ({ type: "RECEIVE_INSTANCES", instances }),
);
export const requestBindings = createAction("REQUEST_BINDINGS");
export const receiveBindings = createAction("RECEIVE_BINDINGS", (bindings: IServiceBinding[]) => ({
  bindings,
  type: "RECEIVE_BINDINGS",
}));
export const requestClasses = createAction("REQUEST_PLANS");
export const receiveClasses = createAction(
  "RECEIVE_CLASSES",
  (classes: IClusterServiceClass[]) => ({
    classes,
    type: "RECEIVE_CLASSES",
  }),
);
export const errorCatalog = createAction(
  "ERROR_CATALOG",
  (err: Error, op: "fetch" | "create" | "delete" | "deprovision") => ({
    err,
    op,
    type: "ERROR_CATALOG",
  }),
);

const actions = [
  checkCatalogInstall,
  installed,
  notInstalled,
  requestBrokers,
  receiveBrokers,
  requestPlans,
  receivePlans,
  requestInstances,
  receiveInstances,
  requestBindings,
  receiveBindings,
  requestClasses,
  receiveClasses,
  errorCatalog,
].map(getReturnOfExpression);

export function provision(
  releaseName: string,
  namespace: string,
  className: string,
  planName: string,
  parameters: {},
) {
  return async (dispatch: Dispatch<IStoreState>) => {
    try {
      await ServiceInstance.create(releaseName, namespace, className, planName, parameters);
      return true;
    } catch (e) {
      dispatch(errorCatalog(e, "create"));
      return false;
    }
  };
}

export function addBinding(bindingName: string, instanceName: string, namespace: string) {
  return async (dispatch: Dispatch<IStoreState>) => {
    try {
      await ServiceBinding.create(bindingName, instanceName, namespace);
      return true;
    } catch (e) {
      dispatch(errorCatalog(e, "create"));
      return false;
    }
  };
}

export function removeBinding(name: string, namespace: string) {
  return async (dispatch: Dispatch<IStoreState>) => {
    try {
      await ServiceBinding.delete(name, namespace);
      return true;
    } catch (e) {
      dispatch(errorCatalog(e, "delete"));
      return false;
    }
  };
}

export function deprovision(instance: IServiceInstance) {
  return async (dispatch: Dispatch<IStoreState>) => {
    try {
      await ServiceCatalog.deprovisionInstance(instance);
      return true;
    } catch (e) {
      dispatch(errorCatalog(e, "deprovision"));
      return false;
    }
  };
}

export function sync(broker: IServiceBroker) {
  return async (dispatch: Dispatch<IStoreState>) => {
    return ServiceCatalog.syncBroker(broker);
  };
}

export type ServiceCatalogAction = typeof actions[number];

export function getBindings(ns?: string) {
  return async (dispatch: Dispatch<IStoreState>) => {
    if (ns && ns === "_all") {
      ns = undefined;
    }
    dispatch(requestBindings());
    try {
      const bindings = await ServiceBinding.list(ns);
      dispatch(receiveBindings(bindings));
      return bindings;
    } catch (e) {
      return dispatch(errorCatalog(e, "fetch"));
    }
  };
}

export function getBrokers() {
  return async (dispatch: Dispatch<IStoreState>) => {
    dispatch(requestBrokers());
    try {
      const brokers = await ServiceCatalog.getServiceBrokers();
      dispatch(receiveBrokers(brokers));
      return brokers;
    } catch (e) {
      return dispatch(errorCatalog(e, "fetch"));
    }
  };
}

export function getClasses() {
  return async (dispatch: Dispatch<IStoreState>) => {
    dispatch(requestClasses());
    try {
      const classes = await ServiceCatalog.getServiceClasses();
      dispatch(receiveClasses(classes));
      return classes;
    } catch (e) {
      return dispatch(errorCatalog(e, "fetch"));
    }
  };
}

export function getInstances(ns?: string) {
  return async (dispatch: Dispatch<IStoreState>) => {
    if (ns && ns === "_all") {
      ns = undefined;
    }
    dispatch(requestInstances());
    try {
      const instances = await ServiceInstance.list(ns);
      dispatch(receiveInstances(instances));
      return instances;
    } catch (e) {
      return dispatch(errorCatalog(e, "fetch"));
    }
  };
}

export function getPlans() {
  return async (dispatch: Dispatch<IStoreState>) => {
    dispatch(requestPlans());
    try {
      const plans = await ServiceCatalog.getServicePlans();
      dispatch(receivePlans(plans));
      return plans;
    } catch (e) {
      return dispatch(errorCatalog(e, "fetch"));
    }
  };
}

export function getCatalog(ns?: string) {
  return async (dispatch: Dispatch<IStoreState>) => {
    dispatch(getBindings(ns));
    dispatch(getBrokers());
    dispatch(getClasses());
    dispatch(getInstances(ns));
    dispatch(getPlans());
  };
}

export function checkCatalogInstalled() {
  return async (dispatch: Dispatch<IStoreState>) => {
    const isInstalled = await ServiceCatalog.isCatalogInstalled();
    isInstalled ? dispatch(installed()) : dispatch(notInstalled());
    return isInstalled;
  };
}