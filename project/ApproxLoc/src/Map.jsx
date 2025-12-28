import React, {useEffect, useState} from "react";
import {MapContainer, Marker, Polyline, Circle, Popup, TileLayer, useMapEvents, ZoomControl} from "react-leaflet";
import "./leaflet_zoom.css"
import {FetchOnMove} from "@/utils/FetchOnMove.jsx";
import {SetViewOnUser} from "@/utils/SetViewOnUser.jsx";
import {Info} from "@/Info.jsx";
import {SearchAdress} from "@/utils/SearchAdress.jsx";
import {startIcon} from "@/assets/StartIcon.jsx";
import {endIcon} from "@/assets/EndIcon.jsx";
import {tempIcon} from "@/assets/TempIcon.jsx";
import {Notification} from "@/utils/Notification.jsx";
import {Slider} from "@/components/ui/slider"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {offsetLatLng, 
    generatePointInRadius, 
    getDistanceMeters, getRoute, 
    pathLength, sharedPathLength} from "@/utils/geo.js";




function Map() {
    const position = [59.3294444, 18.06861];    
    const [start, setStart] = useState(null);
    const [end, setEnd] = useState(null);
    const [notification, setNotification] = useState(null);
    const [viewBox, setViewBox] = useState("");
    const [mapCenter, setMapCenter] = useState(position);
    
    const [radius,setRadius] = useState(3000);
    const [nbrPoint,setNbrPoint] = useState("1");
    const [listPoint, setListPoint] = useState([]);
    const [segments, setSegments] = useState([]);

    const [privacy, setPrivacy] = useState(0.0);
    const [usefulness, setUsefulness] = useState(0.0);
    
    const [isControlPanelCollapsed, setIsControlPanelCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);


    const [addressInit, setAddressInit] = useState('');
    const [addressEnd, setAddressEnd] = useState('');
    const debouncedAddressInit = useDebounce(addressInit, 500); // 500ms de délai
    const debouncedAddressEnd = useDebounce(addressEnd, 500); // 500ms de délai
    const debouncedRadius = useDebounce(radius, 500);
    const debouncedSegments = useDebounce(segments, 300);


    function useDebounce(value, delay) {
        const [debouncedValue, setDebouncedValue] = useState(value);

        useEffect(() => {
            const handler = setTimeout(() => {
                setDebouncedValue(value);
            }, delay);

            return () => {
                clearTimeout(handler);
            };
        }, [value, delay]);

        return debouncedValue;
    }

    useEffect(() => {
        if (debouncedAddressInit && viewBox) {
            fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(debouncedAddressInit)}&format=json&limit=1&viewbox=${viewBox}&bounded=1`)
                .then(response => response.json())
                .then(data => {
                    if (data.length > 0) {
                        const lat = parseFloat(data["0"]["lat"]);
                        const lon = parseFloat(data["0"]["lon"]);
                        setStart({"lat":lat,"lng" : lon});
                    } else {
                        console.error(`Adress ${debouncedAddressInit} not found`);
                    }
                })
                .catch(error => console.error('Error when decoding the location :', error));
        }
    }, [debouncedAddressInit, setStart]);

    useEffect(() => {
        if (debouncedAddressEnd && viewBox) {
            fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(debouncedAddressEnd)}&format=json&limit=1&viewbox=${viewBox}&bounded=1`)
                .then(response => response.json())
                .then(data => {
                    if (data.length > 0) {
                        const lat = parseFloat(data["0"]["lat"]);
                        const lon = parseFloat(data["0"]["lon"]);
                        setEnd({"lat":lat,"lng" : lon});
                    } else {
                        console.error(`Adress ${debouncedAddressEnd} not found`);
                    }
                })
                .catch(error => console.error('Error when decoding the location:', error));
        }
    }, [debouncedAddressEnd, setEnd]);



    function LocationMarkers({ setStart, setEnd, start, end }) {
        useMapEvents({
            click(e) {
                if (!start) {
                    setStart({"lat" : e.latlng.lat,"lng": e.latlng.lng});
                } else if (!end) {
                    setEnd({"lat" : e.latlng.lat,"lng": e.latlng.lng});
                }
            },
        });

        return (
            <>
                {start && (
                    <Marker position={start} icon={startIcon}>
                        <Popup>Start Location</Popup>
                    </Marker>
                )}
                {end && (
                    <Marker position={end} icon={endIcon}>
                        <Popup>End Location</Popup>
                    </Marker>
                )}
            </>
        );
    }

    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);

        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    useEffect(() => {
        async function fetchAllRoutes() {
            if (!start || !end) {
                setSegments([]);
                return;
            }

            const allPoints = [start, ...listPoint];
            const newSegments = [];

            for (let i = 0; i < allPoints.length; i++) {
                const route = await getRoute(allPoints[i], end);
                if (route.length > 0) {
                    newSegments.push(route);
                }
            }

            setSegments(newSegments);
        }
        fetchAllRoutes();
    }, [start, end, listPoint]);
    
    useEffect(() => {
        if (!debouncedSegments || debouncedSegments.length < 2) {
            return;
        }

        const mainPath = debouncedSegments[0];
        const mainLength = pathLength(mainPath);

        if (mainLength < 10) { // path to short, you don't need maps
            setUsefulness(0);
            return;
        }
        let totalPercent = 0;
        let count = 0;
        
        for (let i = 1; i < debouncedSegments.length; i++) {
            const shared = sharedPathLength(debouncedSegments[i], mainPath);
            const percent = (shared / mainLength) * 100;

            totalPercent += percent;
            count++;
        }

        setUsefulness(count > 0 ? totalPercent / count : 0);
    }, [debouncedSegments]);
    
    useEffect(() =>{
        let priv = 0;
        let count = 0;

        for (let i = 0; i < listPoint.length; i++) {
            const intern_formula = radius < 1000 ? 1 : -0.0001
            const shared = 1-Math.exp(-0.0001*debouncedRadius*0.01*getDistanceMeters(listPoint[i],start));
            priv += shared*100;
            count++;
        }

        setPrivacy(count>0 ? priv/count : 0);
    },[debouncedRadius,listPoint, start]);

    useEffect(() => {
        if (!start || !end) return;

        const inside = listPoint.filter(
            p => getDistanceMeters(p, start) <= radius
        );

        const missing = nbrPoint - inside.length;
        const newPoints = [...inside];

        for (let i = 0; i < missing; i++) {
            newPoints.push(generatePointInRadius(start, radius));
        }

        setListPoint(newPoints);
    }, [debouncedRadius, end]);

    useEffect(() => {
    if (!start || !end) return;

    const distance = getDistanceMeters(start, end);

    if (radius > distance) {
        let message = `Radius (${radius} m) is larger than distance between start and end (${Math.round(distance)} m)`;
        let type = 'error';
        setNotification({message,type});
    } else {
        setNotification(null);
    }
}, [debouncedRadius, start, end]);

    useEffect(() => {
        if (start && listPoint.length === 0 && nbrPoint > 0) {
            addPoints(nbrPoint);
        }
    }, [start]);
    

    // Show notification
    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
    };

    // Clear notification
    const clearNotification = () => {
        setNotification(null);
    };

    const resetMarkers = () => {
        setStart(null);
        setEnd(null);
        setNotification(null);
        setListPoint([]);
        setSegments([]);
        setMapCenter(position);
    };


    const addPoints = (input) => {
        if (!start || !end) return;

        const value =
            typeof input === "number"
                ? input
                : parseInt(input.target.value);

        if (isNaN(value) || value < 0 || value > 100) return;

        setNbrPoint(value);

        const inside = listPoint.filter(
            p => getDistanceMeters(p, start) <= radius
        );

        const missing = value - inside.length;
        let newPoints = [...inside];

        for (let i = 0; i < missing; i++) {
            newPoints.push(generatePointInRadius(start, radius));
        }
        if(value < nbrPoint)
            newPoints = newPoints.slice(0,value);

        setListPoint(newPoints);
    };



    const calculateIfMarkers = () => {
        if(!start) alert("initial adress wasn't found, it should have been printed automatically");
        else if(!end) alert("final adress not found, it should have been printed automatically");
    }

    return (
    <>
        <div className="relative h-screen w-screen">

          <MapContainer center={position} zoom={13} zoomControl={false} className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <FetchOnMove setData={setViewBox}/>
            <ZoomControl position="bottomright"/>
            <LocationMarkers setStart={setStart} setEnd={setEnd} start={start} end={end}/>
            <SetViewOnUser center={mapCenter}/>
            {listPoint.map((point, index) => (
                <Marker
                    icon={tempIcon}
                    key={index}
                    position={[point.lat, point.lng]}
                >
                    <Popup>
                    Point {index + 1}
                    </Popup>
                </Marker>
            ))}
            {segments.map((segment, index) => (
                <Polyline
                    key={index}
                    positions={segment}
                    color={index === 0 ? "green" : "blue"}
                    weight={3}
                />
            ))}
            {start && (
                <Circle
                    center={start}
                    radius={radius}
                    pathOptions={{ color: 'red', fillColor: 'rgba(255,0,0,0.2)' }}
                />
            )}

          </MapContainer>
          {/* Notification area */}
            {notification && (
                <div className="absolute bottom-5 right-2 transform -translate-x-1/2 z-100 w-80">
                    <Notification
                        message={notification.message}
                        type={notification.type}
                        onClose={clearNotification}
                    />
                </div>
            )}

            {/* Control panel */}
            <div className={`absolute ${isMobile ? 'bottom-0 left-0 right-0 rounded-b-none rounded-t-lg max-h-[80vh] overflow-y-auto' : 'bottom-5 left-5 max-w-md'} z-[1000] bg-white rounded-lg shadow transition-all duration-300 p-4`}>
                {/* Collapse toggle for mobile */}
                {isMobile && (
                    <div
                        className="flex justify-center  border-b cursor-pointer"
                        onClick={() => setIsControlPanelCollapsed(!isControlPanelCollapsed)}
                    >
                        {isControlPanelCollapsed ?
                            <ChevronUp className="h-5 w-5 text-gray-500" /> :
                            <ChevronDown className="h-5 w-5 text-gray-500" />
                        }
                    </div>
                )}
                <div className={`px-4 py-2 ${isControlPanelCollapsed && isMobile ? 'hidden' : 'block'}`}>
                    <div className="flex flex-col items-center mb-2 relative">
                        <h3 className="font-medium mb-5">Radius in meters</h3>
                        <div className="absolute top-6 text-xs" style={{left: `${((radius[0] - 1) / (10_000 - 1)) * 100}%`, transform: "translateX(-50%)",}}>
                            {radius}
                        </div>
                        <Slider
                            value={[radius]}
                            min={1}
                            max={10000}
                            onValueChange={([v]) => setRadius(v)}
                        />
                    </div>
                    <div className="flex items-center mt-2">
                        <div className="mb-2">
                            <h4>Usefulness % : {usefulness.toFixed(2)} %</h4> 
                            <h4>Privacy % : {privacy.toFixed(2)} %</h4>
                        </div>
                        
                    </div>
                </div>
                {start && (
                    <div className="mb-2">
                        <h4>Real Location : ({start.lat.toFixed(4) },{start.lng.toFixed(4)})</h4> 
                        {end ? <h4>Final Location : ({end.lat.toFixed(4)},{end.lng.toFixed(4)})</h4> : ""}
                    </div>

                )}

                <div className="flex items-center mt-2">
                    <h4>Number of points to simulate</h4>
                    <Input
                        type="number"
                        step="1"
                        min={0}
                        max={20}
                        value={nbrPoint}
                        onChange={addPoints}
                        className="mr-2 w-15"
                    />    
                </div>
                


                <div className="absolute left-5 flex items-center justify-center mt-4">
                    <Info className="z-400"/>
                </div>
                <div className="flex items-center justify-center mt-4">
                    <Button onClick={resetMarkers} className="ml-auto" disabled={!start && !end} variant={"outline"}>
                        Reset
                    </Button>
                </div>
                
            </div>

                <SearchAdress onChange={(e) => setAddressInit(e.target.value)}
                          onChange1={(e) => setAddressEnd(e.target.value)} onClick={calculateIfMarkers}/>
          </div>
    </>
  )
}

export default Map