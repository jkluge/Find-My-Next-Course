import { useState } from "react";
import { useRef, useEffect } from "react";
import FilterEnableCheckbox from "./FilterEnableCheckbox";

export default function DropDownField(props) {


  let paramFieldType = "dropdown";
  const [filterEnabled, setFilterEnabled] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  const items = props.options;

  useEffect(() => {
    setSelectedItems(items);
  }, [items]);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleCheckboxChange = (item) => {
    setSelectedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
    console.log(item);
    props.HandleFilterChange([paramFieldType, props.filterName, item]);
  };

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="m-2">
      <div className="mb-2 text-white flex items-center justify-between">
        <div className="flex items-center">
          <h3>{String(props.filterName).charAt(0).toUpperCase() + String(props.filterName).slice(1)}</h3>
          <div>
            <p className="text-sm opacity-50"> - filter description</p>
          </div>
        </div>
        <FilterEnableCheckbox
          onToggle={() => { setFilterEnabled(!filterEnabled); props.HandleFilterEnable([props.filterName, !filterEnabled]);}}
        />
      </div>
      <div className={`opacity-${filterEnabled ? "100" : "50"} ${filterEnabled ? "pointer-events-auto" : "pointer-events-none user-select-none"
        }`}>

        <div className="relative justify-center text-left w-full"ref={dropdownRef}>
          {/* Dropdown Button */}
          <button
            onClick={toggleDropdown}
            className="bg-violet-500 text-white px-4 py-2 rounded-md shadow-md focus:outline-none hover:bg-[#aba8e0] w-full"
          >
            {selectedItems.length? (selectedItems.join(", ").substring(0, 30) + ((selectedItems.join(", ").substring(0, 30).length>=30)? "...": "") ):"Select Options"}
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className=" bg-[#aba8e0] mx-1 border-b border-x rounded-b-lg shadow-lg z-30">
              <ul className="">
                {items.map((item, index) => (
                  <li key={index} className="flex items-center p-2 hover:bg-gray-500">
                    <label className="flex-auto py-3 px-4 inline-flex gap-x-2 -mt-px -ms-px 
                first:rounded-t-md last:rounded-b-md sm:first:rounded-s-md sm:mt-0 sm:first:ms-0 s
                m:first:rounded-se-none sm:last:rounded-es-none sm:last:rounded-e-md text-sm font-medium
                focus:z-10 border border-gray-200  shadow-2xs cursor-pointer">

                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item)}
                        onChange={() => handleCheckboxChange(item)}
                        className="mr-2 sr-only peer"
                      />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4
                 peer-focus:ring-blue-300  rounded-full peer
                 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full
                 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px]
                 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all
                 peer-checked:bg-violet-500 "></div>
                      <span>{item}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


