const NodeHelper = require("node_helper")
const Log = require("logger");
const url = require('node:url');
const path = require('node:path');
const moment = require('moment');

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

    this.eventLocalTypeList = null;
    this.impactLocalTypeList = null;
    this.eventStateTypeList = null;
    this.eventStateSubtypeList = null;
  },

  async cacheTypesFromODOT(apiKey) {
    resp = await fetch(new url.URL(
      'tripcheck/Tle/TleWazeMetadata',
      API_BASE
    ), {
      method: 'GET',
      headers: getApiHeaders(apiKey)
    })
    let response = await resp.json();
    if (!resp.ok) {
      throw new Error(
        response.message || `API Error - ${resp.status} ${resp.statusText}`);
    }

    this.eventLocalTypeList = response["TLE-incident-items"]["TLE-incd-type-list"];
    this.impactLocalTypeList = response["TLE-incident-items"]["TLE-travel-impact-list"];

    resp = await fetch(new url.URL(
      'tripcheck/Incidents/Metadata',
      API_BASE
    ), {
      method: 'GET',
      headers: getApiHeaders(apiKey)
    })
    response = await resp.json();
    if (!resp.ok) {
      throw new Error(
        response.message || `API Error - ${resp.status} ${resp.statusText}`);
    }

    this.eventStateTypeList = response["incident-metadata-items"]["event-types"];
    this.eventStateSubtypeList = response["incident-metadata-items"]["event-subtypes"];
  },

  resolveLocalEventTypeId(event) {
    let eventType = this.eventLocalTypeList.find((e) => e.type === event);

    if (!eventType) {
      console.error(`Failed to resolve local event type ID from ${event}`);
      return null;
    }

    return eventType["type-id"];
  },

  resolveLocalImpactTypeId(impact) {
    let impactType = this.impactLocalTypeList.find((e) => e["impact-desc"] === impact)

    if (!impactType) {
      console.error(`Failed to resolve local event type ID from ${impact}`);
      return null;
    }

    return impactType["impact-id"];
  },

  resolveStateEventTypeId(event) {
    let eventType = this.eventStateTypeList.find((e) => e.name === event);

    if (!eventType) {
      console.error(`Failed to resolve state event type ID from ${event}`);
      return null;
    }

    return eventType.id;
  },

  resolveStateEventSubtypeId(subtype) {
    let eventSubtype = this.eventStateSubtypeList.find((e) => e.name === subtype)

    if (!eventSubtype) {
      console.error(`Failed to resolve state event subtype ID from ${subtype}`);
      return null;
    }

    return eventSubtype.id;
  },

  resolveStateEventTypeName(eventId) {
    let eventType = this.eventStateTypeList.find((e) => e.id === eventId);

    if (!eventType) {
      console.error(`Failed to resolve state event type Name from ${eventId}`);
      return null;
    }

    return eventType.name;
  },

  resolveStateEventSubtypeName(eventId) {
    let eventSubtype = this.eventStateSubtypeList.find((e) => e.id === eventId)

    if (!eventSubtype) {
      console.error(`Failed to resolve state event type ID from ${eventId}`);
      return null;
    }

    return eventSubtype.name;
  },

  buildLocalIncidentRequest(params, apiKey) {
    const basePath = 'tripcheck/Tle/Events';
    let args = [];
    if ('bounds' in params) {
      args.push('bounds=' + params.bounds);
    }
    if ('eventTypes' in params) {
      let events = [];
      params.eventTypes.forEach((e) => events.push(this.resolveLocalEventTypeId(e, apiKey)));
      args.push('TypeId=' + events.join(','));
    }
    if ('impactTypes' in params) {
      impacts = [];
      params.impactTypes.forEach((i) => impacts.push(this.resolveLocalImpactTypeId(i, apiKey)));
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

  buildStateIncidentRequest(params, apiKey) {
    const basePath = 'tripcheck/Incidents';
    let args = [];
    if ('bounds' in params) {
      args.push('bounds=' + params.bounds);
    }
    if ('eventTypes' in params) {
      let events = [];
      params.eventTypes.forEach((e) => events.push(this.resolveStateEventTypeId(e, apiKey)));
      args.push('EventTypeId=' + events.join(','));
    }
    if ('impactTypes' in params) {
      args.push('ImpactId=' + params.impactTypes.join(','));
    }
    if ('routeIds' in params) {
      args.push('RouteId=' + params.routeIds.join(','));
    }
    if ('activeEvents' in params) {
      args.push('IsActive=' + params.sourceAgency)
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

  formatDate(eventDate) {
    const currentYear = moment().year()
    if (eventDate.year() != currentYear) {
      formatString = "M/D/YYYY"
    } else {
      formatString = "M/D"
    }
    return eventDate.format(formatString)
  },

  async getLocalIncidents(payload, apiKey) {
    resp = await fetch(this.buildLocalIncidentRequest({
      ...payload.incidents.local,
      bounds: payload.incidents.bounds
    }), {
      method: 'GET',
      headers: getApiHeaders(apiKey)
    })
    const response = await resp.json();
    if (!resp.ok) {
      throw new Error(
        response.message || `API Error - ${resp.status} ${resp.statusText}`);
    }
    let incidents = [];
    const filteredResponse = response["Incidents"].filter((i) => !payload.incidents.local.excludeEventIds.includes(i["Id"]));
    filteredResponse.forEach((incident) => {
      const locationDescription = incident["LocationDescription"].replace(/^(.{70}[^\s]*).*/, "$1")
      const locationLeftovers = `<p>${incident["LocationDescription"].slice(locationDescription.length)}</p>`;
      let commentsHTML = incident["Comments"];
      if (locationDescription != incident["LocationDescription"]) {
        commentsHTML = `${locationLeftovers}${incident["Comments"]}`;
      }
      const eventStart = moment(incident["EventStart"])
      const eventEnd = moment(incident["EventEnd"])

      incidents.push({
        eventId: incident["Id"],
        location: locationDescription,
        eventType: incident["Type"],
        impactType: incident["Impact"],
        headline: incident["Headline"],
        commentsHTML: commentsHTML,
        eventStart: this.formatDate(eventStart),
        eventEnd: this.formatDate(eventEnd),
        lastUpdated: incident["UpdateTime"],
        isLongterm: !eventStart.isSame(eventEnd, 'day')
      })
    })

    return incidents;
  },

  async getStateIncidents(payload, apiKey) {
    resp = await fetch(this.buildStateIncidentRequest({
      ...payload.incidents.state,
      bounds: payload.incidents.bounds
    }), {
      method: 'GET',
      headers: getApiHeaders(apiKey)
    })
    const response = await resp.json();
    if (!resp.ok) {
      throw new Error(
        response.message || `API Error - ${resp.status} ${resp.statusText}`);
    }
    let incidents = [];
    const filteredResponse = response.incidents.filter((i) => !payload.incidents.state.excludeEventIds.includes(i["event-id"]));
    filteredResponse.forEach((incident) => {
      const locationDescription = `${incident.location['location-name']} - ${incident.location['start-location']['location-desc']}`;
      let commentsHTML = `<p>${incident.headline}</p>`;
      const eventStart = moment(incident.schedule['project-schedule']['start-date-time'])
      const eventEnd = moment(incident.schedule['project-schedule']['end-date-time'])

      incidents.push({
        incidentId: incident['incident-id'],
        eventId: incident['event-id'],
        location: locationDescription,
        eventType: this.resolveStateEventSubtypeName(incident['event-subtype-id']),
        impactType: incident['impact-id'],
        headline: incident["impact-desc"],
        commentsHTML: commentsHTML,
        eventStart: this.formatDate(eventStart),
        eventEnd: this.formatDate(eventEnd),
        lastUpdated: incident["update-time"],
        isLongterm: !eventStart.isSame(eventEnd, 'day')
      })
    })

    return incidents;
  },

  async socketNotificationReceived(notification, payload) {
    if (notification === "GET_INCIDENT_INFORMATION") {
      const apiKey = payload.apiKey

      try {
        if (
          !this.eventLocalTypeList ||
          !this.impactLocalTypeList ||
          !this.eventStateTypeList ||
          !this.eventStateSubtypeList
        ) {
          await this.cacheTypesFromODOT(apiKey);
        }

        let incidents = [];
        if (payload.incidents.local.display) {
          const localIncidents = await this.getLocalIncidents(payload, apiKey);
          incidents = incidents.concat(localIncidents);
        }
        if (payload.incidents.state.display) {
          const stateIncidents = await this.getStateIncidents(payload, apiKey);
          incidents = incidents.concat(stateIncidents);
        }
        this.sendSocketNotification("GET_INCIDENT_INFORMATION_COMPLETE", incidents);
      } catch (err) {
        console.error(err);
        this.sendSocketNotification("GET_INCIDENT_INFORMATION_COMPLETE", {
          errorMessage: 'Error fetching commute',
          errorDescription: e.message
        });
      }
    }
  },
})
