
-- Update all transit stops to Washington DC coordinates (Howard University area)

-- Red Line (metro) - actual DC metro stations
UPDATE transit_stops SET latitude = 38.9220, longitude = -77.0219, stop_name = 'Shaw-Howard U' WHERE id = 'cc3a741d-7dcc-431d-9f2d-41d82b6a155c';
UPDATE transit_stops SET latitude = 38.9170, longitude = -77.0217, stop_name = 'Mt Vernon Sq' WHERE id = '0422b2a0-4d14-484e-af3c-588a462f3c19';
UPDATE transit_stops SET latitude = 38.9258, longitude = -77.0225, stop_name = 'U Street' WHERE id = '8634204b-4df2-4488-95da-c2ad02518f4f';
UPDATE transit_stops SET latitude = 38.9318, longitude = -77.0294, stop_name = 'Columbia Heights' WHERE id = 'c068280a-6b99-4da4-8754-e21a3a853c7b';
UPDATE transit_stops SET latitude = 38.9364, longitude = -77.0214, stop_name = 'Georgia Ave-Petworth' WHERE id = '019f20f5-d94f-4e93-aa0c-df4641e52496';

-- Blue Line (metro) - DC metro stations  
UPDATE transit_stops SET latitude = 38.8851, longitude = -77.0215, stop_name = 'L''Enfant Plaza' WHERE id = '50bbdef0-fbc1-4bd9-aee6-f07f2212337f';
UPDATE transit_stops SET latitude = 38.8983, longitude = -77.0281, stop_name = 'McPherson Square' WHERE id = 'b2a786d9-2e71-4a2f-bf72-3f111f6e6cd3';
UPDATE transit_stops SET latitude = 38.9013, longitude = -77.0321, stop_name = 'Farragut West' WHERE id = 'd64c723a-56ea-4802-a866-0269ae9e8bf3';
UPDATE transit_stops SET latitude = 38.9011, longitude = -77.0398, stop_name = 'Foggy Bottom' WHERE id = '222e00fc-5e75-495e-8ef3-ba80748a1f22';
UPDATE transit_stops SET latitude = 38.8932, longitude = -77.0707, stop_name = 'Rosslyn' WHERE id = '9195bc4b-3f44-4d8d-8720-9ff12f5fcd80';

-- Campus Loop (shuttle) - Howard University campus area
UPDATE transit_stops SET latitude = 38.9225, longitude = -77.0195, stop_name = 'Founders Library' WHERE id = 'd592d769-1d82-430e-bd6f-f0a1fd960fac';
UPDATE transit_stops SET latitude = 38.9240, longitude = -77.0180, stop_name = 'Blackburn Center' WHERE id = '6360c200-99bc-47d0-93c9-ecec12f41f4a';
UPDATE transit_stops SET latitude = 38.9255, longitude = -77.0165, stop_name = 'College of Medicine' WHERE id = '3f924396-ff0b-44ab-aec5-52c235fc1714';
UPDATE transit_stops SET latitude = 38.9238, longitude = -77.0145, stop_name = 'Greene Stadium' WHERE id = 'eefe0418-ef6f-4bbd-8ef8-f3b1f9682045';
UPDATE transit_stops SET latitude = 38.9215, longitude = -77.0170, stop_name = 'Howard Towers' WHERE id = '3443f4de-82ca-4c70-8fa6-fa11899c265b';
UPDATE transit_stops SET latitude = 38.9225, longitude = -77.0195, stop_name = 'Founders Library' WHERE id = '60ee39fd-e823-47c6-ac65-1f52a0868618';

-- North Express (shuttle) - nearby DC landmarks
UPDATE transit_stops SET latitude = 38.9225, longitude = -77.0195, stop_name = 'Howard Main Gate' WHERE id = '6ca20398-f7d3-4c02-b9cc-9c79a1e740f5';
UPDATE transit_stops SET latitude = 38.9265, longitude = -77.0230, stop_name = 'Howard Hospital' WHERE id = 'aa4da60b-e947-4e4e-a03d-9379a9e275c2';
UPDATE transit_stops SET latitude = 38.9310, longitude = -77.0250, stop_name = 'Meridian Hill' WHERE id = 'cd71c4f3-5280-45e4-8d13-9a79df7cc4ba';
UPDATE transit_stops SET latitude = 38.9350, longitude = -77.0270, stop_name = 'Park View' WHERE id = 'f8908ece-f348-4fed-8f6e-171161b4beee';
