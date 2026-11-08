# MMM-ODOT-TripCheck

*MMM-ODOT-TripCheck* is a module for [MagicMirror²](https://github.com/MagicMirrorOrg/MagicMirror) that displays incident details for the state of Oregon.

## Screenshot

![Example of MMM-ODOT-TripCheck](./example_1.png)

## Installation

### Install

In your terminal, go to the modules directory and clone the repository:

```bash
cd ~/MagicMirror/modules
git clone https://github.com/ardentras/MMM-ODOT-TripCheck
```

### Update

Go to the module directory and pull the latest changes:

```bash
cd ~/MagicMirror/modules/MMM-ODOT-TripCheck
git pull
```

## Configuration

To use this module, you have to add a configuration object to the modules array in the `config/config.js` file.

### Example configuration

Minimal configuration to use the module:

```js
    {
        module: 'MMM-ODOT-TripCheck',
        position: 'lower_third',
        config: {
            apiKey: tripcheckToken
        }
    },
```

Configuration with all options:

```js
    {
        module: 'MMM-ODOT-TripCheck',
        position: 'lower_third',
        config: {
            apiKey: tripcheckToken,
            incidents: {
                bounds: "-121.30374,43.915940,-121.160000,43.986210",
                eventTypes: ["Construction", "Detour", "Vehicle Restriction"],
                impactTypes: ["High", "Closed"],
                sourceAgency: "USDA, Forest Service - Deschutes NF"
            }
        }
    },
```

### Configuration options

Option|Possible values|Default|Description
------|------|------|-----------
`apiKey`|`string`|None (required)|API key for access to the ODOT API
`incidents.bounds`|`string`|None|Lon/Lat rectangle bounds to filter: minLon,minLat,maxLon,maxLat
`incidents.sourceAgency`|`string`|None|The local agency responsible for the local incident
`incidents.eventTypes`|`list(int)`|None|A list of event types to filter by as returned by `http://api.odot.state.or.us/tripcheck/Tle/TleWazeMetadata` under `TLE-incident-items.TLE-incd-type-list`
`incidents.impactTypes`|`list(int)`|None|A list of impact types to filter by as returned by `http://api.odot.state.or.us/tripcheck/Tle/TleWazeMetadata` under `TLE-incident-items.TLE-travel-impact-list`

## Sending notifications to the module

Notification|Description
------|-----------

## Developer commands

- `npm install` - Install devDependencies like ESLint.
- `node --run lint` - Run linting and formatter checks.
- `node --run lint:fix` - Fix linting and formatter issues.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.

## Changelog

All notable changes to this project will be documented in the [CHANGELOG.md](CHANGELOG.md) file.
