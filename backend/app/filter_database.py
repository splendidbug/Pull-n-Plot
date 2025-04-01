import os
import pandas as pd
from flask import current_app
from rapidfuzz import fuzz
from app import db
from app.models import FilteredData


def fuzzy_match(row_value, queries, threshold=80):
    row_value_lower = row_value.lower()
    return any(fuzz.ratio(row_value_lower, q) >= threshold for q in queries)


def add_filtered_data_to_db(task_id, all_filtered_data):
    for source_name, filtered_df in all_filtered_data.items():
        for row_number, row in filtered_df.iterrows():
            for col_name, value in row.items():
                record = FilteredData(
                    task_id=task_id,
                    source=source_name,
                    row_id=row_number,
                    column_name=col_name,
                    column_value=value
                )
                db.session.add(record)

    db.session.commit()


def apply_filters(task_id, data_sources, task_filters):
    data_dir = os.path.join(current_app.root_path, '..', 'sample_data')

    all_filtered_data = {}

    for ds in data_sources:
        source_name = ds["selectedSource"]
        selected_fields = ds.get("selectedFields", [])

        print("task_filters: ", task_filters)
        file_path = os.path.join(data_dir, source_name)

        if not os.path.exists(file_path):
            print(f"File not found: {file_path}")
            continue

        # Load the file into a DataFrame
        df = pd.read_csv(file_path)

        # filter columns
        filtered_df = df[selected_fields] if selected_fields else df

        filters = next(
            (item['fieldFilters']
             for item in task_filters if item['source'] == source_name),
            None  # default if not found
        )
        if filters:
            for field, condition in filters.items():
                # Handle numeric range filter
                if "from" in condition or "to" in condition:
                    filtered_df[field] = pd.to_numeric(
                        filtered_df[field], errors="coerce")

                    from_val = condition.get("from")
                    to_val = condition.get("to")

                    if from_val not in [None, ""]:
                        filtered_df = filtered_df[filtered_df[field] >= float(
                            from_val)]
                    if to_val not in [None, ""]:
                        filtered_df = filtered_df[filtered_df[field] <= float(
                            to_val)]

                # Handle categorical values filter - do fuzzy matching
                elif "values" in condition:
                    query_values = [val.lower() for val in condition['values']]
                    filtered_df = filtered_df[filtered_df[field].apply(
                        lambda x: fuzzy_match(x, query_values))]

        all_filtered_data[source_name] = filtered_df

    print(df)
    print(all_filtered_data)
    add_filtered_data_to_db(task_id, all_filtered_data)
    return all_filtered_data
