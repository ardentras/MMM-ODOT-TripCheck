const NodeHelper = require("node_helper")
const Log = require("logger");
const url = require('node:url');
const path = require('node:path');

const API_BASE = 'https://api.odot.state.or.us';
function getApiHeaders(apiKey) {
  return {
    'Cache-Control': 'no-cache',
    'Ocp-Apim-Subscription-Key': apiKey,
  };
}

module.exports = NodeHelper.create({
  start: function () {
    Log.log(`Starting node helper for: ${this.name}`);

    this.eventTypeList = null;
    this.impactTypeList = null;
  },

  async cacheTypesFromODOT(apiKey) {
    resp = await fetch(new url.URL(
      'tripcheck/Tle/TleWazeMetadata',
      API_BASE
    ), {
      method: 'GET',
      headers: getApiHeaders(apiKey)
    })
    const response = await resp.json();
    if (!resp.ok) {
      throw new Error(
        response.message || `API Error - ${resp.status} ${resp.statusText}`);
    }

    this.eventTypeList = response["TLE-incident-items"]["TLE-incd-type-list"];
    this.impactTypeList = response["TLE-incident-items"]["TLE-travel-impact-list"];
  },

  resolveEventTypeId(event) {
    let eventType = this.eventTypeList.find((e) => e.type === event);

    if (!eventType) {
      console.error(`Failed to resolve event type ID from ${event}`);
      return null;
    }

    return eventType["type-id"];
  },

  resolveImpactTypeId(impact) {
    let impactType = this.impactTypeList.find((e) => e["impact-desc"] === impact)

    if (!impactType) {
      console.error(`Failed to resolve event type ID from ${impact}`);
      return null;
    }

    return impactType["impact-id"];
  },

  buildIncidentRequest(params, apiKey) {
    const basePath = 'tripcheck/Tle/Events';
    let args = [];
    if ('bounds' in params) {
      args.push('bounds=' + params.bounds);
    }
    if ('eventTypes' in params) {
      let events = [];
      params.eventTypes.forEach((e) => events.push(this.resolveEventTypeId(e, apiKey)));
      args.push('TypeId=' + events.join(','));
    }
    if ('impactTypes' in params) {
      impacts = [];
      params.impactTypes.forEach((i) => impacts.push(this.resolveImpactTypeId(i, apiKey)));
      args.push('ImpactId=' + impacts.join(','));
    }
    if ('sourceAgency' in params) {
      args.push('SourceAgency=' + params.sourceAgency)
    }
    let argString = '';
    if (args.length > 0) {
      argString = '?' + args.join('&')
    }

    return new url.URL(
      path.join(
        basePath,
      ) + argString,
      API_BASE
    );
  },

  async socketNotificationReceived(notification, payload) {
    if (notification === "GET_INCIDENT_INFORMATION") {
      const apiKey = payload.apiKey

      try {
        if (!this.eventTypeList || !this.impactTypeList) {
          await this.cacheTypesFromODOT(apiKey);
        }
        resp = await fetch(this.buildIncidentRequest(payload.incidents), {
          method: 'GET',
          headers: getApiHeaders(apiKey)
        })
        const response = await resp.json();
        if (!resp.ok) {
          throw new Error(
            response.message || `API Error - ${resp.status} ${resp.statusText}`);
        }
        let incidents = [];
        response["Incidents"].forEach((incident) => {
          incidents.push({
            location: incident["LocationDescription"],
            eventType: incident["Type"],
            impactType: incident["Impact"],
            headline: incident["Headline"],
            commentsHTML: incident["Comments"],
            eventStart: incident["EventStart"],
            eventEnd: incident["EventEnd"],
            lastUpdated: incident["UpdateTime"]
          })
        })
        this.sendSocketNotification("GET_INCIDENT_INFORMATION_COMPLETE", incidents);
      } catch {
        console.error(err);
        this.sendSocketNotification("GET_INCIDENT_INFORMATION_COMPLETE", {
          errorMessage: 'Error fetching commute',
          errorDescription: e.message
        });
      }
    }
  },
})
